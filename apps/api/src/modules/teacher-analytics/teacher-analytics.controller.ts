import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { TeacherAnalyticsService } from './teacher-analytics.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Teacher Analytics')
@ApiBearerAuth('access-token')
@Roles(Role.TEACHER)
@Controller('teacher/analytics')
export class TeacherAnalyticsController {
  constructor(private readonly analyticsService: TeacherAnalyticsService) {}

  @Get('revenue')
  @ApiOperation({ summary: '[Teacher] Revenue Analytics — total, monthly trend, per-course' })
  getRevenue(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getRevenueAnalytics(user.id);
  }

  @Get('students')
  @ApiOperation({ summary: '[Teacher] Student Analytics — totals, enrollment trend, per-course' })
  getStudents(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getStudentAnalytics(user.id);
  }

  @Get('retention')
  @ApiOperation({ summary: '[Teacher] Retention Analytics — active vs inactive students' })
  getRetention(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getRetentionAnalytics(user.id);
  }

  @Get('course-performance')
  @ApiOperation({ summary: '[Teacher] Course Performance + Completion Analytics, compared across all courses' })
  getCoursePerformance(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getCoursePerformance(user.id);
  }

  @Get('dashboard-widgets')
  @ApiOperation({ summary: '[Teacher] One aggregated call powering the dashboard home widgets' })
  getDashboardWidgets(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getDashboardWidgets(user.id);
  }

  @Get('export/students.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({ summary: '[Teacher] Export Reports — students & progress as CSV' })
  async exportStudents(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const csv = await this.analyticsService.exportStudentsReportCsv(user.id);
    res.setHeader('Content-Disposition', 'attachment; filename="students-report.csv"');
    res.send('\uFEFF' + csv); // BOM so Excel renders Arabic correctly
  }

  @Get('export/revenue.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({ summary: '[Teacher] Export Reports — revenue as CSV' })
  async exportRevenue(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const csv = await this.analyticsService.exportRevenueReportCsv(user.id);
    res.setHeader('Content-Disposition', 'attachment; filename="revenue-report.csv"');
    res.send('\uFEFF' + csv);
  }
}
