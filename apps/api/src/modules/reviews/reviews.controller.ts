import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('courses/:courseId/reviews')
  @ApiOperation({ summary: 'List all reviews for a course' })
  findForCourse(@Param('courseId') courseId: string) {
    return this.reviewsService.findForCourse(courseId);
  }

  @Post('courses/:courseId/reviews')
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Student] Add a review (requires enrollment)' })
  create(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, courseId, dto);
  }

  @Put('courses/:courseId/reviews')
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Student] Update my review for a course' })
  update(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.update(user.id, courseId, dto);
  }

  @Delete('courses/:courseId/reviews')
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Student] Delete my review for a course' })
  remove(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewsService.remove(user.id, courseId);
  }
}
