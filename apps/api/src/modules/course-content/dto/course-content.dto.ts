import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ example: 'هل الكورس يحتاج خبرة سابقة؟' })
  @IsString()
  @IsNotEmpty()
  questionAr: string;

  @ApiProperty({ example: 'لأ، الكورس مبني من الصفر ومناسب للمبتدئين' })
  @IsString()
  @IsNotEmpty()
  answerAr: string;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'تحديث جديد في الكورس' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ example: 'ضفنا فصل جديد عن التطبيقات العملية...' })
  @IsString()
  @IsNotEmpty()
  bodyAr: string;
}
