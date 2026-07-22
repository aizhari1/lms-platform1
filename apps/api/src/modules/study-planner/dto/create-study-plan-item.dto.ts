import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStudyPlanItemDto {
  @ApiProperty({ example: 'مراجعة الفصل التالت' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ required: false, example: 'ركز على تمارين المعادلات' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, example: 'course-cuid' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ example: '2026-07-20T18:00:00.000Z' })
  @IsDateString()
  dueDate: string;
}
