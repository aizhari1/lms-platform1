import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { SendMessageDto, StartConversationDto } from './dto/message.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

@ApiTags('Messaging')
@ApiBearerAuth('access-token')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Start a new conversation with a user' })
  startConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartConversationDto,
  ) {
    return this.messagingService.startConversation(user.id, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all my conversations' })
  findMyConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.findMyConversations(user.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get all messages in a conversation' })
  findMessages(
    @Param('id') conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagingService.findMessages(user.id, conversationId);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message in an existing conversation' })
  sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(user.id, conversationId, dto);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark a conversation as read' })
  markAsRead(
    @Param('id') conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagingService.markConversationAsRead(user.id, conversationId);
  }
}
