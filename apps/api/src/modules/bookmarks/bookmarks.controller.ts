import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Bookmarks')
@ApiBearerAuth('access-token')
@Roles(Role.STUDENT)
@Controller()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post('bookmarks')
  @ApiOperation({ summary: '[Student] Bookmark a moment in a lesson video' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.create(user.id, dto);
  }

  @Get('bookmarks')
  @ApiOperation({ summary: '[Student] List all my bookmarks across all courses' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.bookmarksService.findAllForStudent(user.id);
  }

  @Get('lessons/:lessonId/bookmarks')
  @ApiOperation({ summary: '[Student] List my bookmarks for a specific lesson' })
  findByLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookmarksService.findByLesson(user.id, lessonId);
  }

  @Delete('bookmarks/:bookmarkId')
  @ApiOperation({ summary: '[Student] Remove a bookmark' })
  remove(
    @Param('bookmarkId') bookmarkId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookmarksService.remove(user.id, bookmarkId);
  }
}
