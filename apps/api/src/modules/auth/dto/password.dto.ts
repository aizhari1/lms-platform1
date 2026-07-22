import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token sent to the user email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewP@ssw0rd123' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  newPassword: string;
}
