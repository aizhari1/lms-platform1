import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class SubmittedAnswerDto {
  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Selected choice ids for MCQ/True-False questions',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedChoiceIds?: string[];

  @ApiProperty({ required: false, description: 'Free text answer for essay/fill-blank questions' })
  @IsOptional()
  @IsString()
  essayText?: string;

  @ApiProperty({
    required: false,
    description: 'MATCHING only: [{ choiceId, submittedMatch }]',
  })
  @IsOptional()
  @IsArray()
  matchingAnswers?: { choiceId: string; submittedMatch: string }[];
}

export class SubmitExamAttemptDto {
  @ApiProperty({ type: [SubmittedAnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerDto)
  answers: SubmittedAnswerDto[];
}

export class ManualGradeAnswerDto {
  @ApiProperty({ example: 4.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pointsAwarded: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reviewerNote?: string;
}
