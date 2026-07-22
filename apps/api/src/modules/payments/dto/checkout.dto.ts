import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentProvider, CouponType } from '@prisma/client';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Course id to purchase' })
  @IsString()
  courseId: string;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.STRIPE })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  courseId: string;
}

export class CreateCouponDto {
  @ApiProperty({ example: 'SIRAJ20' })
  @IsString()
  code: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ example: 20 })
  value: number;

  @ApiProperty({ required: false })
  @IsOptional()
  maxUses?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  minOrderAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  validUntil?: string;
}
