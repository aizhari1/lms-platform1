import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AchievementsService } from './achievements.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Achievements')
@ApiBearerAuth('access-token')
@Roles(Role.STUDENT)
@Controller()
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('achievements/streak')
  @ApiOperation({ summary: '[Student] My current & longest learning streak' })
  getMyStreak(@CurrentUser() user: AuthenticatedUser) {
    return this.achievementsService.getMyStreak(user.id);
  }

  @Get('achievements/badges')
  @ApiOperation({ summary: '[Student] Full badge catalog with my earned status' })
  getMyBadges(@CurrentUser() user: AuthenticatedUser) {
    return this.achievementsService.getMyBadges(user.id);
  }
}
