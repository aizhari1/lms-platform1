import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProgressService } from './progress.service';
import { UpdateLessonProgressDto } from './dto/update-progress.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Progress')
@ApiBearerAuth('access-token')
@Roles(Role.STUDENT)
@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Patch('lessons/:lessonId/progress')
  @ApiOperation({ summary: '[Student] Update watch progress for a lesson' })
  updateLessonProgress(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLessonProgressDto,
  ) {
    return this.progressService.updateLessonProgress(user.id, lessonId, dto);
  }

  @Get('courses/:courseId/progress')
  @ApiOperation({ summary: '[Student] Get my overall progress in a course' })
  getCourseProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.getCourseProgress(user.id, courseId);
  }

  @Get('progress/continue-watching')
  @ApiOperation({ summary: '[Student] Lessons I started but haven\'t finished, most recent first' })
  getContinueWatching(@CurrentUser() user: AuthenticatedUser) {
    return this.progressService.getContinueWatching(user.id);
  }

  @Get('progress/watch-history')
  @ApiOperation({ summary: '[Student] My full watch history across all courses' })
  getWatchHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.progressService.getWatchHistory(user.id);
  }

  @Get('courses/:courseId/completion-timeline')
  @ApiOperation({ summary: '[Student] My lesson-by-lesson completion timeline for a course' })
  getCourseCompletionTimeline(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.getCourseCompletionTimeline(user.id, courseId);
  }

  @Get('courses/:courseId/analytics')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: '[Teacher] Course progress analytics (completion rate, drop-off points)' })
  getCourseAnalytics(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.getCourseAnalyticsForTeacher(user.id, courseId);
  }
}
