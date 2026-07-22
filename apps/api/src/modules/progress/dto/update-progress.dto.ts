import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateLessonProgressDto {
  @ApiProperty({ example: 245, description: 'Current playback position in seconds' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lastPositionSec: number;

  @ApiProperty({ example: 245, description: 'Cumulative watched seconds (for analytics)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  watchedSeconds?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
