import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned-url')
  @ApiOperation({
    summary:
      'Get a presigned URL to upload a file directly to S3/MinIO from the browser (used by Uppy)',
  })
  requestUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.uploadsService.createPresignedUploadUrl(user.id, dto);
  }
}
