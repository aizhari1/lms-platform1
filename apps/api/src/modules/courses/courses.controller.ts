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
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  QueryCoursesDto,
  UpdateCourseDto,
} from './dto/course.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // -----------------------------------------------------------------
  // PUBLIC
  // -----------------------------------------------------------------
  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse published courses (search, filter, sort, paginate)' })
  findPublished(@Query() query: QueryCoursesDto) {
    return this.coursesService.findPublished(query);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get full published course details by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.coursesService.findPublishedBySlug(slug);
  }

  @Public()
  @Get(':courseId/related')
  @ApiOperation({ summary: 'Related courses in the same category' })
  findRelated(@Param('courseId') courseId: string) {
    return this.coursesService.findRelated(courseId);
  }

  // -----------------------------------------------------------------
  // TEACHER
  // -----------------------------------------------------------------
  @Post()
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] Create a new draft course' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.create(user.id, dto);
  }

  @Get('my-courses')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] List my own courses (any status)' })
  findMyCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.findAllForTeacher(user.id);
  }

  @Get(':id/edit')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] Get full course data for editing (owner only)' })
  findOneForOwner(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.findOneForOwner(id, user);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] Update course details (owner only)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, user, dto);
  }

  @Patch(':id/submit-for-review')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] Submit a draft course for admin review' })
  submitForReview(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.submitForReview(id, user);
  }

  @Patch(':id/archive')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] Archive a published course' })
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.archive(id, user);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] Soft-delete a course (owner only)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.remove(id, user);
  }

  // -----------------------------------------------------------------
  // ADMIN — moderation
  // -----------------------------------------------------------------
  @Get('admin/pending-review')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] List courses awaiting review' })
  findPendingReview() {
    return this.coursesService.findPendingReview();
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Approve and publish a course' })
  approve(@Param('id') id: string) {
    return this.coursesService.approve(id);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Reject a course pending review' })
  reject(@Param('id') id: string) {
    return this.coursesService.reject(id);
  }
}
