import { PrismaClient, Role, UserStatus, CourseStatus, CourseLevel, Locale } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('P@ssw0rd123', 12);

  // -----------------------------------------------------------------
  // Users
  // -----------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: 'admin@siraj.dev' },
    update: {},
    create: {
      email: 'admin@siraj.dev',
      passwordHash,
      fullName: 'مدير المنصة',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@siraj.dev' },
    update: {},
    create: {
      email: 'teacher@siraj.dev',
      passwordHash,
      fullName: 'أحمد المعلم',
      role: Role.TEACHER,
      status: UserStatus.ACTIVE,
      bio: 'مدرّس تطوير الويب بخبرة أكثر من 8 سنوات',
      emailVerifiedAt: new Date(),
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@siraj.dev' },
    update: {},
    create: {
      email: 'student@siraj.dev',
      passwordHash,
      fullName: 'محمد الطالب',
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Users created:', { admin: admin.email, teacher: teacher.email, student: student.email });

  // -----------------------------------------------------------------
  // Category
  // -----------------------------------------------------------------
  const category = await prisma.category.upsert({
    where: { slug: 'web-development' },
    update: {},
    create: {
      nameAr: 'تطوير الويب',
      nameEn: 'Web Development',
      slug: 'web-development',
      order: 0,
    },
  });

  // -----------------------------------------------------------------
  // Course + Chapters + Lessons
  // -----------------------------------------------------------------
  const course = await prisma.course.upsert({
    where: { slug: 'complete-web-development-bootcamp' },
    update: {},
    create: {
      slug: 'complete-web-development-bootcamp',
      titleAr: 'دورة تطوير الويب الشاملة من الصفر للاحتراف',
      titleEn: 'Complete Web Development Bootcamp',
      subtitleAr: 'تعلّم HTML, CSS, JavaScript, React وNode.js في مسار واحد',
      descriptionAr:
        'دورة متكاملة تأخذك من الصفر حتى بناء تطبيقات ويب كاملة باستخدام أحدث التقنيات، مع مشاريع عملية وامتحانات وشهادة معتمدة.',
      price: 499,
      discountPrice: 299,
      currency: 'SAR',
      level: CourseLevel.BEGINNER,
      language: Locale.AR,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      teacherId: teacher.id,
      categoryId: category.id,
      requirements: ['جهاز كمبيوتر متصل بالإنترنت', 'لا يشترط خبرة سابقة'],
      outcomes: ['بناء مواقع ويب كاملة', 'فهم React وNode.js', 'نشر التطبيقات على الإنترنت'],
      tags: ['html', 'css', 'javascript', 'react', 'nodejs'],
    },
  });

  const chapter = await prisma.chapter.create({
    data: {
      courseId: course.id,
      titleAr: 'الفصل الأول: أساسيات HTML',
      order: 0,
      lessons: {
        create: [
          {
            titleAr: 'مقدمة عن HTML وبنية الصفحة',
            type: 'VIDEO',
            order: 0,
            isFreePreview: true,
            videoDurationSec: 600,
          },
          {
            titleAr: 'عناصر النص والروابط',
            type: 'VIDEO',
            order: 1,
            videoDurationSec: 480,
          },
        ],
      },
    },
  });

  console.log('✅ Course created:', course.titleAr, '| Chapter:', chapter.titleAr);

  // -----------------------------------------------------------------
  // Badge catalog (static, upserted so re-running the seed is safe)
  // -----------------------------------------------------------------
  const badgeCatalog = [
    {
      code: 'FIRST_LESSON' as const,
      titleAr: 'أول خطوة',
      descriptionAr: 'أكملت أول درس ليك على المنصة',
      icon: 'footprints',
    },
    {
      code: 'STREAK_7_DAYS' as const,
      titleAr: 'متعلم مثابر',
      descriptionAr: '7 أيام متتالية من التعلم',
      icon: 'flame',
    },
    {
      code: 'STREAK_30_DAYS' as const,
      titleAr: 'ماراثون التعلم',
      descriptionAr: '30 يوم متتالي من التعلم',
      icon: 'flame',
    },
    {
      code: 'FIRST_CERTIFICATE' as const,
      titleAr: 'بطل الشهادات',
      descriptionAr: 'حصلت على أول شهادة إتمام',
      icon: 'award',
    },
    {
      code: 'FIRST_COURSE_COMPLETED' as const,
      titleAr: 'نجم الإنجاز',
      descriptionAr: 'أكملت أول كورس بالكامل',
      icon: 'star',
    },
    {
      code: 'FIVE_COURSES_COMPLETED' as const,
      titleAr: 'مستكشف المعرفة',
      descriptionAr: 'أكملت 5 كورسات على المنصة',
      icon: 'trophy',
    },
  ];

  for (const badge of badgeCatalog) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {},
      create: badge,
    });
  }

  console.log('✅ Badge catalog seeded:', badgeCatalog.length, 'badges');

  console.log('🎉 Seeding complete!');
  console.log('---------------------------------------------------');
  console.log('Login credentials (password for all: P@ssw0rd123):');
  console.log('  Admin:   admin@siraj.dev');
  console.log('  Teacher: teacher@siraj.dev');
  console.log('  Student: student@siraj.dev');
  console.log('---------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
