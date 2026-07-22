import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { SendMessageDto, StartConversationDto } from './dto/message.dto';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async startConversation(userId: string, dto: StartConversationDto) {
    if (userId === dto.recipientId) {
      throw new ForbiddenException('You cannot message yourself');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: { userId: { in: [userId, dto.recipientId] } },
        },
      },
      include: { participants: true },
    });

    const conversation =
      existing && existing.participants.length === 2
        ? existing
        : await this.prisma.conversation.create({
            data: {
              isGroup: false,
              participants: {
                create: [{ userId }, { userId: dto.recipientId }],
              },
            },
          });

    const message = await this.sendMessage(userId, conversation.id, {
      content: dto.firstMessage,
    });

    return { conversationId: conversation.id, message };
  }

  async sendMessage(
    senderId: string,
    conversationId: string,
    dto: SendMessageDto,
  ) {
    await this.assertParticipant(conversationId, senderId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: dto.content,
        attachmentUrl: dto.attachmentUrl,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Decoupled from the Socket.IO gateway — ChatGateway listens for this
    // event and pushes it to connected clients in the conversation room.
    this.eventEmitter.emit('message.sent', { conversationId, message });

    return message;
  }

  async findMyConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async findMessages(userId: string, conversationId: string) {
    await this.assertParticipant(conversationId, userId);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async markConversationAsRead(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
  }

  private async assertParticipant(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }
  }
}
