import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'FCM device token from the client app' })
  @IsString()
  fcmToken: string;

  @ApiProperty({ example: 'web', enum: ['web', 'ios', 'android'] })
  @IsString()
  deviceType: string;
}
