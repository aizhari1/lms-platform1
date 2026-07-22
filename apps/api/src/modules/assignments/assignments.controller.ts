import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AssignmentsService } from './assignments.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  RequestRevisionDto,
} from './dto/assignment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Assignments')
@ApiBearerAuth('access-token')
@Controller()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  // --- Teacher ---
  @Post('courses/:courseId/assignments')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Create an assignment (optionally with a grading rubric)' })
  create(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(courseId, user, dto);
  }

  @Patch('assignments/:assignmentId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Update an assignment' })
  update(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(assignmentId, user, dto);
  }

  @Delete('assignments/:assignmentId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Delete an assignment' })
  remove(@Param('assignmentId') assignmentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.assignmentsService.remove(assignmentId, user);
  }

  @Get('assignments/:assignmentId/submissions')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Grading queue — latest submission per student' })
  findSubmissions(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentsService.findLatestSubmissions(assignmentId, user);
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Grade a submission (rubric scores + overall feedback)' })
  grade(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, user, dto);
  }

  @Patch('submissions/:submissionId/request-revision')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Send a submission back for revision' })
  requestRevision(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestRevisionDto,
  ) {
    return this.assignmentsService.requestRevision(submissionId, user, dto);
  }

  // --- Student ---
  @Get('courses/:courseId/assignments')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] List assignments for a course with my latest submission status' })
  findForStudent(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentsService.findForStudent(courseId, user.id);
  }

  @Get('assignments/:assignmentId/my-submissions')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] My Submission History for this assignment' })
  findMyHistory(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentsService.findMySubmissionHistory(assignmentId, user.id);
  }

  @Post('assignments/:assignmentId/submit')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Submit (or resubmit) an assignment with multiple files' })
  submit(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.assignmentsService.submit(assignmentId, user.id, dto);
  }
}
