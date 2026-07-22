import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TeacherBulkService } from './teacher-bulk.service';
import { BulkNotifyDto, BulkEmailDto, BulkGradeDto } from './dto/teacher-bulk.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Teacher Bulk Operations')
@ApiBearerAuth('access-token')
@Roles(Role.TEACHER)
@Controller('teacher/bulk')
export class TeacherBulkController {
  constructor(private readonly bulkService: TeacherBulkService) {}

  @Post('courses/:courseId/notify')
  @ApiOperation({ summary: '[Teacher] Bulk Notifications — notify every enrolled student at once' })
  bulkNotify(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkNotifyDto,
  ) {
    return this.bulkService.bulkNotify(courseId, user.id, dto.titleAr, dto.bodyAr);
  }

  @Post('courses/:courseId/email')
  @ApiOperation({ summary: '[Teacher] Bulk Emails — email every enrolled student at once' })
  bulkEmail(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkEmailDto,
  ) {
    return this.bulkService.bulkEmail(courseId, user.id, dto.subject, dto.bodyHtml);
  }

  @Post('assignments/grade')
  @ApiOperation({ summary: '[Teacher] Bulk Assignment Review — grade many submissions at once' })
  bulkGrade(@CurrentUser() user: AuthenticatedUser, @Body() dto: BulkGradeDto) {
    return this.bulkService.bulkGradeSubmissions(user.id, dto.submissionIds, dto.grade, dto.feedbackAr);
  }
}
