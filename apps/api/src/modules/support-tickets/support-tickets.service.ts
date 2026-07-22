import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ReplyTicketDto } from './dto/reply-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Injectable()
export class SupportTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------------
  // STUDENT
  // -----------------------------------------------------------------
  async create(studentId: string, dto: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        studentId,
        subject: dto.subject,
        category: dto.category ?? 'GENERAL',
        messages: {
          create: { senderId: studentId, body: dto.message },
        },
      },
      include: { messages: true },
    });
  }

  async findMine(studentId: string) {
    return this.prisma.supportTicket.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
  }

  // -----------------------------------------------------------------
  // SHARED (student sees their own, staff sees any)
  // -----------------------------------------------------------------
  async findOne(ticketId: string, user: AuthenticatedUser) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        student: { select: { id: true, fullName: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (user.role === Role.STUDENT && ticket.studentId !== user.id) {
      throw new ForbiddenException('You do not own this ticket');
    }

    return ticket;
  }

  async reply(ticketId: string, user: AuthenticatedUser, dto: ReplyTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (user.role === Role.STUDENT && ticket.studentId !== user.id) {
      throw new ForbiddenException('You do not own this ticket');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.ticketMessage.create({
        data: {
          ticketId,
          senderId: user.id,
          body: dto.body,
          attachmentUrl: dto.attachmentUrl,
        },
        include: { sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
      }),
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          // A staff reply nudges an OPEN ticket into IN_PROGRESS automatically.
          ...(user.role !== Role.STUDENT && ticket.status === TicketStatus.OPEN
            ? { status: TicketStatus.IN_PROGRESS }
            : {}),
        },
      }),
    ]);

    return message;
  }

  // -----------------------------------------------------------------
  // ADMIN / TEACHER (support staff)
  // -----------------------------------------------------------------
  async findAll(status?: TicketStatus) {
    return this.prisma.supportTicket.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: {
        student: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { messages: true } },
      },
    });
  }

  async updateStatus(ticketId: string, dto: UpdateTicketStatusDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.priority ? { priority: dto.priority } : {}),
      },
    });
  }
}
