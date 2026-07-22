import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  data: { userId?: string };
}

/**
 * ChatGateway
 * ---------------------------------------------------------------------
 * Real-time layer for private messaging. Clients connect with their
 * JWT access token (as a query param or auth header), join a room per
 * conversation, and receive messages pushed by MessagingService via
 * the decoupled 'message.sent' event (see EventEmitterModule).
 * ---------------------------------------------------------------------
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token?.toString();

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });

      client.data.userId = payload.sub;
      this.logger.log(`Client connected: user ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(`Client disconnected: user ${client.data.userId ?? 'unknown'}`);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    client: AuthenticatedSocket,
    conversationId: string,
  ): void {
    client.join(`conversation:${conversationId}`);
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    client: AuthenticatedSocket,
    conversationId: string,
  ): void {
    client.leave(`conversation:${conversationId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    client: AuthenticatedSocket,
    payload: { conversationId: string },
  ): void {
    client
      .to(`conversation:${payload.conversationId}`)
      .emit('user_typing', { userId: client.data.userId });
  }

  /**
   * Listens for messages persisted by MessagingService and broadcasts
   * them to everyone currently in that conversation's room.
   */
  @OnEvent('message.sent')
  handleMessageSent(payload: { conversationId: string; message: unknown }): void {
    this.server
      .to(`conversation:${payload.conversationId}`)
      .emit('new_message', payload.message);
  }
}
