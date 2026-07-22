import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateDiscountCampaignDto {
  @ApiProperty({ example: 'خصم الجمعة البيضاء' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ example: 30, description: 'Percentage off, applied automatically — no code needed' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(90)
  discountPct: number;

  @ApiProperty({ required: false, description: 'Omit for a platform-wide sale' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ example: '2026-11-25T00:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: '2026-11-30T23:59:59.000Z' })
  @IsDateString()
  endsAt: string;
}
