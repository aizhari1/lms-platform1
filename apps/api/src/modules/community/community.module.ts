import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommentsController } from './comments/comments.controller';
import { CommentsService } from './comments/comments.service';
import { MessagingController } from './messaging/messaging.controller';
import { MessagingService } from './messaging/messaging.service';
import { ChatGateway } from '../../gateways/chat.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
      }),
    }),
  ],
  controllers: [CommentsController, MessagingController],
  providers: [CommentsService, MessagingService, ChatGateway],
  exports: [CommentsService, MessagingService],
})
export class CommunityModule {}
