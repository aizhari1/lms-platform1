import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'مشكلة في تشغيل الفيديو' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'مش قادر أشغل فيديو الدرس التالت من كورس التفاضل' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    required: false,
    example: 'TECHNICAL',
    enum: ['GENERAL', 'TECHNICAL', 'BILLING', 'COURSE_CONTENT', 'ACCOUNT'],
  })
  @IsOptional()
  @IsIn(['GENERAL', 'TECHNICAL', 'BILLING', 'COURSE_CONTENT', 'ACCOUNT'])
  category?: string;
}
