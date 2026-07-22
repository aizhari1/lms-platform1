import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuestionType, QuestionDifficulty } from '@prisma/client';

export class CreateExamDto {
  @ApiProperty({ example: 'امتحان الفصل الأول' })
  @IsString()
  @MaxLength(150)
  titleAr: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiProperty({ required: false, description: 'Attach to a course (omit for a standalone quiz)' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ default: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMin: number;

  @ApiProperty({ default: 60 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  passScorePct: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  randomizeOrder?: boolean;

  @ApiProperty({ required: false, description: 'If set, randomly pick N questions from the full pool per attempt' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionsToPick?: number;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiProperty({ default: false, description: 'Deduct points for wrong answers' })
  @IsOptional()
  @IsBoolean()
  negativeMarkingEnabled?: boolean;

  @ApiProperty({ default: 0, description: 'Points deducted per wrong answer (only used if negativeMarkingEnabled)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  negativeMarkPerWrong?: number;
}

export class UpdateExamDto extends PartialType(CreateExamDto) {}

class ChoiceInputDto {
  @ApiProperty()
  @IsString()
  textAr: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiProperty({
    required: false,
    description: 'MATCHING only: the correct right-side pair for this left-side item',
  })
  @IsOptional()
  @IsString()
  matchValue?: string;
}

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType, default: QuestionType.MCQ_SINGLE })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: 'ما هو الوسم الصحيح لإنشاء رابط في HTML؟' })
  @IsString()
  textAr: string;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  points?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  explanationAr?: string;

  @ApiProperty({ enum: QuestionDifficulty, default: QuestionDifficulty.MEDIUM, required: false })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @ApiProperty({ required: false, description: 'Group this question under a Question Category' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    type: [ChoiceInputDto],
    required: false,
    description:
      'MCQ_SINGLE/MCQ_MULTIPLE/TRUE_FALSE: choices with isCorrect. ' +
      'MATCHING: choices with textAr (left) + matchValue (correct right pair). ' +
      'ORDERING: choices with textAr, submitted in the CORRECT order (order field is auto-assigned). ' +
      'Omit for ESSAY/FILL_BLANK.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => ChoiceInputDto)
  choices?: ChoiceInputDto[];
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}
