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
import { ChaptersService } from './chapters.service';
import {
  CreateChapterDto,
  ReorderChaptersDto,
  UpdateChapterDto,
} from './dto/chapter.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

@ApiTags('Chapters')
@ApiBearerAuth('access-token')
@Roles(Role.TEACHER, Role.ADMIN)
@Controller('courses/:courseId/chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @ApiOperation({ summary: '[Teacher] Add a new chapter to a course' })
  create(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateChapterDto,
  ) {
    return this.chaptersService.create(courseId, user, dto);
  }

  @Get()
  @ApiOperation({ summary: '[Teacher] List chapters + lessons for a course (owner only)' })
  findAll(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chaptersService.findAllForCourse(courseId, user);
  }

  @Patch('reorder')
  @ApiOperation({ summary: '[Teacher] Reorder all chapters in a course' })
  reorder(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReorderChaptersDto,
  ) {
    return this.chaptersService.reorder(courseId, user, dto);
  }

  @Patch(':chapterId')
  @ApiOperation({ summary: '[Teacher] Update a chapter title' })
  update(
    @Param('chapterId') chapterId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateChapterDto,
  ) {
    return this.chaptersService.update(chapterId, user, dto);
  }

  @Delete(':chapterId')
  @ApiOperation({ summary: '[Teacher] Delete a chapter (and its lessons)' })
  remove(
    @Param('chapterId') chapterId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chaptersService.remove(chapterId, user);
  }
}
