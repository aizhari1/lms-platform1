import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CertificatesService } from './certificates.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('courses/:courseId/issue')
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Student] Issue my certificate for a completed course' })
  issue(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.certificatesService.issueCertificate(user.id, courseId);
  }

  @Get('my-certificates')
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Student] List all my earned certificates' })
  myCertificates(@CurrentUser() user: AuthenticatedUser) {
    return this.certificatesService.findMyCertificates(user.id);
  }

  @Public()
  @Get('verify/:certificateNo')
  @ApiOperation({ summary: 'Publicly verify a certificate by its number (QR code target)' })
  verify(@Param('certificateNo') certificateNo: string) {
    return this.certificatesService.verifyByCertificateNo(certificateNo);
  }
}
