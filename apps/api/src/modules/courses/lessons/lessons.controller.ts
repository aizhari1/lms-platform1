import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { LessonsService } from './lessons.service';
import {
  CreateLessonDto,
  ReorderLessonsDto,
  UpdateLessonDto,
} from './dto/lesson.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

@ApiTags('Lessons')
@ApiBearerAuth('access-token')
@Controller()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // -----------------------------------------------------------------
  // TEACHER — managed under a chapter
  // -----------------------------------------------------------------
  @Post('chapters/:chapterId/lessons')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Add a lesson to a chapter' })
  create(
    @Param('chapterId') chapterId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(chapterId, user, dto);
  }

  @Patch('chapters/:chapterId/lessons/reorder')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Reorder lessons within a chapter' })
  reorder(
    @Param('chapterId') chapterId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReorderLessonsDto,
  ) {
    return this.lessonsService.reorder(chapterId, user, dto);
  }

  @Patch('lessons/:lessonId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Update a lesson' })
  update(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(lessonId, user, dto);
  }

  @Delete('lessons/:lessonId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Delete a lesson' })
  remove(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.remove(lessonId, user);
  }

  // -----------------------------------------------------------------
  // STUDENT — watch (gated by enrollment/free preview)
  // -----------------------------------------------------------------
  @Get('lessons/:lessonId/watch')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @ApiOperation({
    summary: '[Student] Get lesson content to watch (requires enrollment unless free preview)',
  })
  watch(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.findForStudent(lessonId, user.id);
  }
}
