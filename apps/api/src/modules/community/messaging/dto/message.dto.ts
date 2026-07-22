import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class StartConversationDto {
  @ApiProperty({ description: 'User id to start a conversation with' })
  @IsString()
  recipientId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  firstMessage: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
