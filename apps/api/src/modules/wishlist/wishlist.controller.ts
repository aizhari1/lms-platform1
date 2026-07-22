import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { WishlistService } from './wishlist.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Wishlist')
@ApiBearerAuth('access-token')
@Roles(Role.STUDENT)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: '[Student] Get my wishlist' })
  findMyWishlist(@CurrentUser() user: AuthenticatedUser) {
    return this.wishlistService.findMyWishlist(user.id);
  }

  @Post(':courseId')
  @ApiOperation({ summary: '[Student] Add a course to my wishlist' })
  add(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistService.add(user.id, courseId);
  }

  @Delete(':courseId')
  @ApiOperation({ summary: '[Student] Remove a course from my wishlist' })
  remove(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistService.remove(user.id, courseId);
  }
}
