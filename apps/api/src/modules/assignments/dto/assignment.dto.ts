import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class RubricCriterionInputDto {
  @ApiProperty({ example: 'وضوح الكود وتنظيمه' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPoints: number;
}

export class CreateAssignmentDto {
  @ApiProperty({ example: 'مشروع تطبيق To-Do List' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ example: 'اعمل تطبيق بسيط لإدارة المهام باستخدام React' })
  @IsString()
  @IsNotEmpty()
  descriptionAr: string;

  @ApiProperty({ required: false, description: 'Attach to a specific lesson' })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  allowLateSubmission?: boolean;

  @ApiProperty({ default: 0, description: '% of total points deducted per day late' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  latePenaltyPctPerDay?: number;

  @ApiProperty({ default: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxFiles?: number;

  @ApiProperty({ default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxPoints?: number;

  @ApiProperty({
    type: [RubricCriterionInputDto],
    required: false,
    description: 'Optional grading rubric — omit for simple pass/fail-style grading',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RubricCriterionInputDto)
  rubricCriteria?: RubricCriterionInputDto[];
}

export class UpdateAssignmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowLateSubmission?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  latePenaltyPctPerDay?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxFiles?: number;
}

class SubmissionFileInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSizeKb?: number;
}

export class SubmitAssignmentDto {
  @ApiProperty({
    type: [SubmissionFileInputDto],
    description: 'Multiple File Upload — 1 or more files per submission',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmissionFileInputDto)
  files: SubmissionFileInputDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notesAr?: string;
}

class RubricScoreInputDto {
  @ApiProperty()
  @IsString()
  criterionId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pointsAwarded: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class GradeSubmissionDto {
  @ApiProperty({ required: false, description: 'Overall grade (required if no rubric)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  grade?: number;

  @ApiProperty({ required: false, description: 'Teacher Feedback shown to the student' })
  @IsOptional()
  @IsString()
  feedbackAr?: string;

  @ApiProperty({ type: [RubricScoreInputDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricScoreInputDto)
  rubricScores?: RubricScoreInputDto[];
}

export class RequestRevisionDto {
  @ApiProperty({ example: 'محتاج تضيف تعليقات أكتر في الكود وتصلّح الـ bug في صفحة تسجيل الدخول' })
  @IsString()
  @IsNotEmpty()
  revisionNote: string;
}
