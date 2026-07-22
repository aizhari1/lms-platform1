import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CourseContentService } from './course-content.service';
import { CreateFaqDto, CreateAnnouncementDto } from './dto/course-content.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Course Content (FAQ & Announcements)')
@Controller()
export class CourseContentController {
  constructor(private readonly courseContentService: CourseContentService) {}

  // --- FAQ ---
  @Post('courses/:courseId/faqs')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] Add an FAQ entry to a course' })
  createFaq(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFaqDto,
  ) {
    return this.courseContentService.createFaq(courseId, user, dto);
  }

  @Public()
  @Get('courses/:courseId/faqs')
  @ApiOperation({ summary: 'List FAQ entries for a course' })
  findFaqs(@Param('courseId') courseId: string) {
    return this.courseContentService.findFaqs(courseId);
  }

  @Delete('faqs/:faqId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] Remove an FAQ entry' })
  removeFaq(@Param('faqId') faqId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.courseContentService.removeFaq(faqId, user);
  }

  // --- Announcements ---
  @Post('courses/:courseId/announcements')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] Post a course announcement (notifies all students)' })
  createAnnouncement(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.courseContentService.createAnnouncement(courseId, user, dto);
  }

  @Public()
  @Get('courses/:courseId/announcements')
  @ApiOperation({ summary: 'List announcements for a course' })
  findAnnouncements(@Param('courseId') courseId: string) {
    return this.courseContentService.findAnnouncements(courseId);
  }

  @Delete('announcements/:announcementId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] Remove an announcement' })
  removeAnnouncement(
    @Param('announcementId') announcementId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.courseContentService.removeAnnouncement(announcementId, user);
  }
}
