import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RecentlyViewedService } from './recently-viewed.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Recently Viewed')
@ApiBearerAuth('access-token')
@Roles(Role.STUDENT)
@Controller()
export class RecentlyViewedController {
  constructor(private readonly recentlyViewedService: RecentlyViewedService) {}

  @Post('courses/:courseId/view')
  @ApiOperation({ summary: '[Student] Record that I viewed a course page' })
  recordView(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.recentlyViewedService.recordView(user.id, courseId);
  }

  @Get('recently-viewed')
  @ApiOperation({ summary: '[Student] Courses I recently browsed' })
  findRecent(@CurrentUser() user: AuthenticatedUser) {
    return this.recentlyViewedService.findRecent(user.id);
  }
}
