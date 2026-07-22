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
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Post a comment or reply on a course/lesson' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.id, dto);
  }

  @Public()
  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all comments for a course' })
  findForCourse(@Param('courseId') courseId: string) {
    return this.commentsService.findForCourse(courseId);
  }

  @Get('lesson/:lessonId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all comments (Q&A) for a lesson' })
  findForLesson(@Param('lessonId') lessonId: string) {
    return this.commentsService.findForLesson(lessonId);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Edit my own comment' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, user, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete my own comment (or any comment as Admin)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.commentsService.remove(id, user);
  }
}
