import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StudyPlannerService } from './study-planner.service';
import { CreateStudyPlanItemDto } from './dto/create-study-plan-item.dto';
import { UpdateStudyPlanItemDto } from './dto/update-study-plan-item.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Study Planner')
@ApiBearerAuth('access-token')
@Roles(Role.STUDENT)
@Controller()
export class StudyPlannerController {
  constructor(private readonly studyPlannerService: StudyPlannerService) {}

  @Post('study-plan')
  @ApiOperation({ summary: '[Student] Add a study plan task' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudyPlanItemDto) {
    return this.studyPlannerService.create(user.id, dto);
  }

  @Get('study-plan')
  @ApiOperation({ summary: '[Student] List all my study plan tasks' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.studyPlannerService.findAll(user.id);
  }

  @Patch('study-plan/:itemId')
  @ApiOperation({ summary: '[Student] Edit or complete a study plan task' })
  update(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStudyPlanItemDto,
  ) {
    return this.studyPlannerService.update(user.id, itemId, dto);
  }

  @Delete('study-plan/:itemId')
  @ApiOperation({ summary: '[Student] Delete a study plan task' })
  remove(@Param('itemId') itemId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.studyPlannerService.remove(user.id, itemId);
  }

  @Get('calendar')
  @ApiOperation({ summary: '[Student] My unified calendar: study tasks + live sessions' })
  getCalendar(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.studyPlannerService.getCalendar(user.id, from, to);
  }
}
