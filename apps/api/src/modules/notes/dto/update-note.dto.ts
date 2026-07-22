import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ example: 'نص الملاحظة بعد التعديل' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
