import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookmarkDto {
  @ApiProperty({ example: 'lesson-cuid' })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiProperty({ example: 340, description: 'Video timestamp (seconds) being bookmarked' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timestampSec: number;

  @ApiProperty({ required: false, example: 'شرح مهم عن التفاضل' })
  @IsOptional()
  @IsString()
  label?: string;
}
