import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateTicketStatusDto {
  @ApiProperty({ required: false, enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiProperty({ required: false, enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
