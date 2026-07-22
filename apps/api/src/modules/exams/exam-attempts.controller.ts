import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ExamAttemptsService } from './exam-attempts.service';
import { ManualGradeAnswerDto, SubmitExamAttemptDto } from './dto/exam-attempt.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Exam Attempts')
@ApiBearerAuth('access-token')
@Controller()
export class ExamAttemptsController {
  constructor(private readonly attemptsService: ExamAttemptsService) {}

  @Post('exams/:examId/attempts/start')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Start (or resume) an exam attempt' })
  start(
    @Param('examId') examId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attemptsService.startAttempt(user.id, examId);
  }

  @Patch('attempts/:attemptId/submit')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Submit answers for grading' })
  submit(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitExamAttemptDto,
  ) {
    return this.attemptsService.submitAttempt(user.id, attemptId, dto);
  }

  @Get('attempts/:attemptId/result')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Get the result of a submitted attempt (Answer Review)' })
  getResult(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attemptsService.getAttemptResult(attemptId, user);
  }

  @Get('my-attempts')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] List all my exam/assignment attempts' })
  findMyAttempts(@CurrentUser() user: AuthenticatedUser) {
    return this.attemptsService.findMyAttempts(user.id);
  }

  @Get('my-attempts/timeline')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Chronological timeline of assignment/exam activity' })
  findMyTimeline(@CurrentUser() user: AuthenticatedUser) {
    return this.attemptsService.findMyTimeline(user.id);
  }

  @Patch('answers/:answerId/grade')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Manually grade an essay answer' })
  gradeEssay(
    @Param('answerId') answerId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ManualGradeAnswerDto,
  ) {
    return this.attemptsService.gradeEssayAnswer(answerId, user, dto);
  }
}
