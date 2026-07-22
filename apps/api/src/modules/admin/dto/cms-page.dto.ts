import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCmsPageDto {
  @ApiProperty({ example: 'about-us' })
  @IsString()
  @MaxLength(120)
  slug: string;

  @ApiProperty({ example: 'من نحن' })
  @IsString()
  @MaxLength(150)
  titleAr: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty()
  @IsString()
  contentAr: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contentEn?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ required: false, description: 'SEO Manager' })
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @ApiProperty({ required: false, description: 'SEO Manager' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;
}

export class UpdateCmsPageDto extends PartialType(CreateCmsPageDto) {}
