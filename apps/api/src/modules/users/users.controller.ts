import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import {
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin-update-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // -----------------------------------------------------------------
  // SELF-SERVICE — any authenticated user
  // -----------------------------------------------------------------
  @Get('me')
  @ApiOperation({ summary: 'Get the current logged-in user profile' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/avatar')
  @ApiOperation({
    summary:
      'Update avatar URL (file is uploaded client-side to S3/Cloudinary first via the Uploads module, then the resulting URL is saved here)',
  })
  updateAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Body('avatarUrl') avatarUrl: string,
  ) {
    return this.usersService.updateAvatar(user.id, avatarUrl);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Soft-delete (deactivate) the current account' })
  deleteMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.softDeleteOwnAccount(user.id);
  }

  // -----------------------------------------------------------------
  // PUBLIC — teacher profile page
  // -----------------------------------------------------------------
  @Public()
  @Get('teachers/:id')
  @ApiOperation({ summary: 'Get a public teacher profile (used on course pages)' })
  getTeacherProfile(@Param('id') id: string) {
    return this.usersService.getPublicTeacherProfile(id);
  }

  // -----------------------------------------------------------------
  // ADMIN ONLY
  // -----------------------------------------------------------------
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List/search/filter all users (paginated)' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Get a single user by id' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOneOrThrow(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Suspend / ban / reactivate a user' })
  updateStatus(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(admin.id, id, dto.status);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Change a user role' })
  updateRole(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(admin.id, id, dto.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Soft-delete a user account' })
  remove(@Param('id') id: string) {
    return this.usersService.adminSoftDelete(id);
  }
}
