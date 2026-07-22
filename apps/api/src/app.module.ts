import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';

import { PrismaModule } from './database/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ChaptersModule } from './modules/courses/chapters/chapters.module';
import { LessonsModule } from './modules/courses/lessons/lessons.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { ProgressModule } from './modules/progress/progress.module';
import { ExamsModule } from './modules/exams/exams.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MailModule } from './modules/mail/mail.module';
import { CommunityModule } from './modules/community/community.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SearchModule } from './modules/search/search.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotesModule } from './modules/notes/notes.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { StudyPlannerModule } from './modules/study-planner/study-planner.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { RecentlyViewedModule } from './modules/recently-viewed/recently-viewed.module';
import { SupportTicketsModule } from './modules/support-tickets/support-tickets.module';
import { CourseContentModule } from './modules/course-content/course-content.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { DiscountCampaignsModule } from './modules/discount-campaigns/discount-campaigns.module';
import { TeacherAnalyticsModule } from './modules/teacher-analytics/teacher-analytics.module';
import { TeacherBulkModule } from './modules/teacher-bulk/teacher-bulk.module';
import { SecurityModule } from './modules/security/security.module';
import { CacheModule } from './modules/cache/cache.module';
import { QueueModule } from './modules/queue/queue.module';
// ---------------------------------------------------------------------

@Module({
  imports: [
    // Global environment configuration, loaded once and injected everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, jwtConfig, redisConfig],
      cache: true,
    }),

    // Global rate limiting (protects every route by default;
    // override per-route with @Throttle() or @SkipThrottle())
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Enables decoupled domain events, e.g. "course.published",
    // "payment.succeeded" -> consumed by notifications/email listeners
    EventEmitterModule.forRoot(),

    // Enables @Cron() decorators for scheduled jobs (e.g. subscription
    // renewal checks, cleanup of expired exam attempts)
    ScheduleModule.forRoot(),

    // Global Redis-backed cache (wires up the previously-unused ioredis
    // dependency) — feature modules inject CacheService directly.
    CacheModule,
    QueueModule,

    // Database access, available globally via PrismaService
    PrismaModule,

    // --- Feature modules (added incrementally) ---
    AuthModule,
    UsersModule,
    CategoriesModule,
    CoursesModule,
    ChaptersModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
    ExamsModule,
    CertificatesModule,
    PaymentsModule,
    NotificationsModule,
    MailModule,
    CommunityModule,
    ReviewsModule,
    WishlistModule,
    UploadsModule,
    SearchModule,
    AdminModule,
    NotesModule,
    BookmarksModule,
    AchievementsModule,
    StudyPlannerModule,
    ResourcesModule,
    RecentlyViewedModule,
    SupportTicketsModule,
    CourseContentModule,
    AssignmentsModule,
    DiscountCampaignsModule,
    TeacherAnalyticsModule,
    TeacherBulkModule,
    SecurityModule,
  ],
  providers: [
    // Applies rate limiting to every route in the app by default
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
