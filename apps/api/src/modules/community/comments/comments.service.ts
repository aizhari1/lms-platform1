import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCommentDto) {
    if (!dto.courseId && !dto.lessonId) {
      throw new BadRequestException(
        'A comment must be attached to either a course or a lesson',
      );
    }

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        userId,
        content: dto.content,
        courseId: dto.courseId,
        lessonId: dto.lessonId,
        parentId: dto.parentId,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
      },
    });

    // TODO: emit 'comment.replied' event -> notify the parent comment's
    // author via NotificationsService when dto.parentId is set.

    return comment;
  }

  async findForCourse(courseId: string) {
    return this.prisma.comment.findMany({
      where: { courseId, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
          },
        },
      },
    });
  }

  async findForLesson(lessonId: string) {
    return this.prisma.comment.findMany({
      where: { lessonId, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
          },
        },
      },
    });
  }

  async update(
    commentId: string,
    user: AuthenticatedUser,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content, isEdited: true },
    });
  }

  async remove(commentId: string, user: AuthenticatedUser): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }
}
