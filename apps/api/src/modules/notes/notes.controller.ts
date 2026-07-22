import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Notes')
@ApiBearerAuth('access-token')
@Roles(Role.STUDENT)
@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('notes')
  @ApiOperation({ summary: '[Student] Add a personal note to a lesson' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateNoteDto) {
    return this.notesService.create(user.id, dto);
  }

  @Get('notes')
  @ApiOperation({ summary: '[Student] List all my notes across all courses' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notesService.findAllForStudent(user.id);
  }

  @Get('lessons/:lessonId/notes')
  @ApiOperation({ summary: '[Student] List my notes for a specific lesson' })
  findByLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notesService.findByLesson(user.id, lessonId);
  }

  @Patch('notes/:noteId')
  @ApiOperation({ summary: '[Student] Edit a note' })
  update(
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(user.id, noteId, dto);
  }

  @Delete('notes/:noteId')
  @ApiOperation({ summary: '[Student] Delete a note' })
  remove(@Param('noteId') noteId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notesService.remove(user.id, noteId);
  }
}
