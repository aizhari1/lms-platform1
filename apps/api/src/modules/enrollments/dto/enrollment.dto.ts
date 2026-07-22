import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'Course id to enroll in' })
  @IsString()
  courseId: string;

  @ApiProperty({ required: false, description: 'Coupon code applied at checkout, if any' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
