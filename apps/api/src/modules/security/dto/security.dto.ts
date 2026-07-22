import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Verify2faDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class TrustDeviceDto {
  @ApiProperty({ example: 'Chrome on Windows — المنزل' })
  @IsString()
  @IsNotEmpty()
  label: string;
}
