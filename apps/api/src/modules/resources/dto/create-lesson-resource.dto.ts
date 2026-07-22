import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateLessonResourceDto {
  @ApiProperty({ example: 'شرائح المحاضرة' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ example: 'https://cdn.siraj.dev/resources/slides.pdf' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ example: 'pdf', required: false })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiProperty({ example: 2048, required: false, description: 'File size in KB' })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSizeKb?: number;
}
