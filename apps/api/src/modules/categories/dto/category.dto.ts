import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'تطوير الويب' })
  @IsString()
  @MaxLength(100)
  nameAr: string;

  @ApiProperty({ example: 'Web Development' })
  @IsString()
  @MaxLength(100)
  nameEn: string;

  @ApiProperty({ example: 'web-development' })
  @IsString()
  @MaxLength(120)
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiProperty({ required: false, description: 'Parent category id for subcategories' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
