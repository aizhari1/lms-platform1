import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminAnalyticsService } from './admin-analytics.service';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin Analytics')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: '[Admin] KPI overview cards' })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('revenue')
  @ApiOperation({ summary: '[Admin] Revenue chart data over time' })
  getRevenue(@Query('days') days?: number) {
    return this.analyticsService.getRevenueOverTime(days);
  }

  @Get('top-courses')
  @ApiOperation({ summary: '[Admin] Best-selling courses' })
  getTopCourses(@Query('limit') limit?: number) {
    return this.analyticsService.getTopCourses(limit);
  }

  @Get('user-growth')
  @ApiOperation({ summary: '[Admin] New signups over time' })
  getUserGrowth(@Query('days') days?: number) {
    return this.analyticsService.getUserGrowth(days);
  }
}
