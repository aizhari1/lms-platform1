import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ResourcesService } from './resources.service';
import { CreateLessonResourceDto } from './dto/create-lesson-resource.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Resources')
@ApiBearerAuth('access-token')
@Controller()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post('lessons/:lessonId/resources')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Attach a downloadable resource to a lesson' })
  createForLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLessonResourceDto,
  ) {
    return this.resourcesService.createForLesson(lessonId, user, dto);
  }

  @Get('lessons/:lessonId/resources')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'List resources attached to a lesson' })
  findByLesson(@Param('lessonId') lessonId: string) {
    return this.resourcesService.findByLesson(lessonId);
  }

  @Delete('resources/:resourceId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: '[Teacher] Remove a lesson resource' })
  removeResource(
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resourcesService.removeResource(resourceId, user);
  }

  @Get('downloads')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Download Center — every resource across my courses' })
  getDownloadCenter(@CurrentUser() user: AuthenticatedUser) {
    return this.resourcesService.getDownloadCenter(user.id);
  }

  @Get('courses/:courseId/resources')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Downloadable resources for one course' })
  getCourseResources(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resourcesService.getCourseResources(user.id, courseId);
  }

  @Post('resources/:resourceId/save')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Save a resource for quick access' })
  saveResource(
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resourcesService.saveResource(user.id, resourceId);
  }

  @Delete('resources/:resourceId/save')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Unsave a resource' })
  unsaveResource(
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resourcesService.unsaveResource(user.id, resourceId);
  }

  @Get('resources/saved')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] My saved resources' })
  getSavedResources(@CurrentUser() user: AuthenticatedUser) {
    return this.resourcesService.getSavedResources(user.id);
  }
}
