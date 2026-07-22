import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({ example: 'الفصل الأول: مقدمة في HTML' })
  @IsString()
  @MaxLength(150)
  titleAr: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  titleEn?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateChapterDto extends PartialType(CreateChapterDto) {}

export class ReorderChaptersDto {
  @ApiProperty({
    type: [String],
    description: 'Chapter ids in the desired display order',
  })
  @IsString({ each: true })
  orderedChapterIds: string[];
}
