import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false, example: 'Ahmed Mohamed' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName?: string;

  @ApiProperty({ required: false, example: '+966501234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'Frontend developer & lifelong learner' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ required: false, enum: ['AR', 'EN'] })
  @IsOptional()
  @IsIn(['AR', 'EN'])
  locale?: 'AR' | 'EN';

  @ApiProperty({ required: false, example: 'Africa/Cairo' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
