import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;
}
