import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { buildPaginatedResult, PaginatedResult } from '../../common/dto/paginated-result';

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  bio: true,
  role: true,
  status: true,
  locale: true,
  timezone: true,
  phone: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof PUBLIC_USER_SELECT }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------------
  // SELF-SERVICE (any authenticated user)
  // -----------------------------------------------------------------
  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: PUBLIC_USER_SELECT,
    });
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<PublicUser> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: PUBLIC_USER_SELECT,
    });
  }

  async softDeleteOwnAccount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), status: UserStatus.SUSPENDED },
    });
  }

  // -----------------------------------------------------------------
  // PUBLIC (teacher profile shown on course pages)
  // -----------------------------------------------------------------
  async getPublicTeacherProfile(teacherId: string) {
    const teacher = await this.prisma.user.findFirst({
      where: { id: teacherId, role: Role.TEACHER, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        _count: { select: { coursesTaught: true } },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  // -----------------------------------------------------------------
  // ADMIN
  // -----------------------------------------------------------------
  async findAll(query: QueryUsersDto): Promise<PaginatedResult<PublicUser>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: PUBLIC_USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, page, limit);
  }

  async findOneOrThrow(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateStatus(
    adminId: string,
    targetUserId: string,
    status: UserStatus,
  ): Promise<PublicUser> {
    if (adminId === targetUserId) {
      throw new ForbiddenException('You cannot change your own account status');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: PUBLIC_USER_SELECT,
    });
  }

  async updateRole(
    adminId: string,
    targetUserId: string,
    role: Role,
  ): Promise<PublicUser> {
    if (adminId === targetUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: PUBLIC_USER_SELECT,
    });
  }

  async adminSoftDelete(targetUserId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { deletedAt: new Date(), status: UserStatus.SUSPENDED },
    });
  }
}
