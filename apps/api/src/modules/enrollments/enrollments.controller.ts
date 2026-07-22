import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/enrollment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Enrollments')
@ApiBearerAuth('access-token')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('free')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Enroll instantly in a free course' })
  enrollFree(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.enrollmentsService.enrollFree(user.id, dto.courseId);
  }

  @Get('my-courses')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] List all courses I am enrolled in' })
  myEnrollments(@CurrentUser() user: AuthenticatedUser) {
    return this.enrollmentsService.findMyEnrollments(user.id);
  }

  @Get(':courseId/access')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Check whether I have access to a course' })
  checkAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentsService.checkAccess(user.id, courseId);
  }

  @Get('course/:courseId/students')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] List students enrolled in one of my courses' })
  findStudentsForCourse(@Param('courseId') courseId: string) {
    return this.enrollmentsService.findStudentsForCourse(courseId);
  }
}
