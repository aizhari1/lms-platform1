import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BulkNotifyDto {
  @ApiProperty({ example: 'تذكير بامتحان نهاية الوحدة' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ example: 'الامتحان هيتفتح بكرة الساعة 9 الصبح، ذاكروا كويس!' })
  @IsString()
  @IsNotEmpty()
  bodyAr: string;
}

export class BulkEmailDto {
  @ApiProperty({ example: 'إعلان مهم عن الكورس' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: '<p>احنا ضفنا فصل جديد للكورس...</p>' })
  @IsString()
  @IsNotEmpty()
  bodyHtml: string;
}

export class BulkGradeDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  submissionIds: string[];

  @ApiProperty({ example: 90 })
  grade: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  feedbackAr?: string;
}
