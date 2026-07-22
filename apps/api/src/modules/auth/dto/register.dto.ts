import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Ahmed Mohamed' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd123',
    description:
      'Minimum 8 characters, must include at least one letter and one number',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

  @ApiProperty({ required: false, example: '+966501234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    enum: Role,
    required: false,
    default: Role.STUDENT,
    description:
      'Only STUDENT or TEACHER can self-register. ADMIN accounts are created internally.',
  })
  @IsOptional()
  @IsEnum([Role.STUDENT, Role.TEACHER], {
    message: 'role must be either STUDENT or TEACHER',
  })
  role?: Role;
}
