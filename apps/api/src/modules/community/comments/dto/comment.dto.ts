import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'شرح ممتاز جدًا، استفدت كثيرًا!' })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({ required: false, description: 'Parent comment id when replying' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  content: string;
}
