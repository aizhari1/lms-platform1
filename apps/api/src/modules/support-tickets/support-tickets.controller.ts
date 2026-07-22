import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, TicketStatus } from '@prisma/client';
import { SupportTicketsService } from './support-tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ReplyTicketDto } from './dto/reply-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Support Tickets')
@ApiBearerAuth('access-token')
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly ticketsService: SupportTicketsService) {}

  @Post()
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Open a new support ticket' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(user.id, dto);
  }

  @Get('mine')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] List my support tickets' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.findMine(user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: '[Staff] List all support tickets, optionally filtered by status' })
  findAll(@Query('status') status?: TicketStatus) {
    return this.ticketsService.findAll(status);
  }

  @Get(':ticketId')
  @Roles(Role.STUDENT, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'View a ticket and its full message thread' })
  findOne(@Param('ticketId') ticketId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.findOne(ticketId, user);
  }

  @Post(':ticketId/messages')
  @Roles(Role.STUDENT, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Reply to a ticket' })
  reply(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplyTicketDto,
  ) {
    return this.ticketsService.reply(ticketId, user, dto);
  }

  @Patch(':ticketId/status')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: '[Staff] Update ticket status/priority' })
  updateStatus(
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.updateStatus(ticketId, dto);
  }
}
