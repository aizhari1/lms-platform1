import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReplyTicketDto {
  @ApiProperty({ example: 'شكرًا لتواصلك، جاري حل المشكلة...' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
