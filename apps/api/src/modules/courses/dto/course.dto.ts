import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CourseLevel, Locale } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({ example: 'دورة تطوير الويب الشاملة' })
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  titleAr: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  titleEn?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitleAr?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitleEn?: string;

  @ApiProperty({ example: 'تعلم تطوير الويب من الصفر حتى الاحتراف...' })
  @IsString()
  @MinLength(20)
  descriptionAr: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  promoVideoUrl?: string;

  @ApiProperty({ example: 499 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ required: false, example: 299 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPrice?: number;

  @ApiProperty({ required: false, default: 'SAR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: CourseLevel, default: CourseLevel.ALL_LEVELS })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiProperty({ enum: Locale, default: Locale.AR })
  @IsEnum(Locale)
  language: Locale;

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  requirements?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  outcomes?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, description: 'SEO Manager: custom <title> tag, falls back to titleAr' })
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @ApiProperty({ required: false, description: 'SEO Manager: meta description for search results' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @ApiProperty({ required: false, description: 'SEO Manager: comma-separated keywords' })
  @IsOptional()
  @IsString()
  metaKeywords?: string;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class QueryCoursesDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 12;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiProperty({ required: false, enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiProperty({ required: false, description: 'teacher id filter' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({
    required: false,
    enum: ['newest', 'price_asc', 'price_desc', 'top_rated', 'most_popular'],
    default: 'newest',
  })
  @IsOptional()
  @IsString()
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'top_rated' | 'most_popular';
}
