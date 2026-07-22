import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ExamsService } from './exams.service';
import {
  CreateExamDto,
  CreateQuestionDto,
  UpdateExamDto,
  UpdateQuestionDto,
} from './dto/exam.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Exams')
@ApiBearerAuth('access-token')
@Roles(Role.TEACHER, Role.ADMIN)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @ApiOperation({ summary: '[Teacher] Create a new exam/quiz' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExamDto) {
    return this.examsService.create(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Teacher] Get exam with all questions (owner only)' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.findOneWithQuestions(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[Teacher] Update exam settings' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examsService.update(id, user, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Teacher] Delete an exam' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.remove(id, user);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: '[Teacher] Add a question to an exam' })
  addQuestion(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.examsService.addQuestion(id, user, dto);
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: '[Teacher] Update a question' })
  updateQuestion(
    @Param('questionId') questionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.examsService.updateQuestion(questionId, user, dto);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: '[Teacher] Delete a question' })
  removeQuestion(
    @Param('questionId') questionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examsService.removeQuestion(questionId, user);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: '[Teacher] Exam Analytics — pass rate, average score, per-question difficulty' })
  getAnalytics(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.getExamAnalytics(id, user);
  }

  @Post('courses/:courseId/question-categories')
  @ApiOperation({ summary: '[Teacher] Create a question category for a course' })
  createCategory(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('nameAr') nameAr: string,
  ) {
    return this.examsService.createCategory(courseId, user, nameAr);
  }

  @Get('courses/:courseId/question-categories')
  @ApiOperation({ summary: 'List question categories for a course' })
  findCategories(@Param('courseId') courseId: string) {
    return this.examsService.findCategories(courseId);
  }

  @Delete('question-categories/:categoryId')
  @ApiOperation({ summary: '[Teacher] Delete a question category' })
  removeCategory(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examsService.removeCategory(categoryId, user);
  }

  @Get('courses/:courseId/question-bank')
  @ApiOperation({ summary: '[Teacher] Question Bank — every question ever written for this course, filterable' })
  findQuestionBank(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('categoryId') categoryId?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.examsService.findQuestionBank(courseId, user, { categoryId, difficulty });
  }
}
