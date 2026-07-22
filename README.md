# سراج (SIRAJ) — منصة تعليمية متكاملة

منصة LMS إنتاجية كاملة: Next.js 15 + NestJS + PostgreSQL + Prisma، بدعم RTL/LTR كامل، ثلاث لوحات تحكم (طالب/معلم/أدمن)، نظام امتحانات وشهادات، ودفع عبر Stripe و Paymob.

---

## 📁 هيكل المشروع

```
lms-platform/
├── apps/
│   ├── api/     ← Backend (NestJS + Prisma + PostgreSQL)
│   └── web/     ← Frontend (Next.js 15 + Tailwind + next-intl)
└── docker-compose.yml   ← Postgres + Redis + MinIO + pgAdmin
```

---

## 🚀 التشغيل السريع (Local Development)

### 1. تشغيل قواعد البيانات

```bash
cd lms-platform
docker compose up -d
```

هيشغّل:
| الخدمة | البورت | الاستخدام |
|---|---|---|
| PostgreSQL | 5432 | قاعدة البيانات الرئيسية |
| Redis | 6379 | Cache + Queues |
| MinIO | 9000 (API) / 9001 (Console) | تخزين ملفات محلي بديل لـ S3 |
| pgAdmin | 5050 | إدارة قاعدة البيانات بصريًا |

### 2. تشغيل الباك إند (NestJS)

```bash
cd apps/api
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

- API: `http://localhost:4000/api/v1`
- Swagger Docs: `http://localhost:4000/api/docs`

**حسابات تجريبية بعد الـ seed** (الباسورد لكل الحسابات: `P@ssw0rd123`):
| الدور | الإيميل |
|---|---|
| Admin | admin@siraj.dev |
| Teacher | teacher@siraj.dev |
| Student | student@siraj.dev |

### 3. تشغيل الفرونت إند (Next.js)

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

- الموقع: `http://localhost:3000` (بيحوّلك أوتوماتيك لـ `/ar` أو `/en`)

---

## 🔑 متغيرات البيئة المهمة

راجع `.env.example` في كل من `apps/api` و `apps/web`. أهم المتغيرات اللي **لازم** تغيّرها قبل أي نشر حقيقي:

- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — سلاسل عشوائية طويلة (32+ حرف)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — من لوحة Stripe
- `PAYMOB_*` — من لوحة Paymob (للسوق المصري/الخليجي)
- `AWS_*` أو `MINIO_*` — حسب اختيارك لتخزين الملفات
- `FIREBASE_*` — لو حابب تفعّل Push Notifications
- `RESEND_API_KEY` — لإرسال الإيميلات
- `ALGOLIA_*` — لتفعيل البحث السريع (اختياري، النظام بيشتغل بدونه بس بدون فهرسة)

---

## 🏗️ الحالة الحالية للمشروع

### Backend (21 موديول — مكتمل بالكامل)
Auth · Users · Categories · Courses · Chapters · Lessons · Enrollments · Progress · Exams+Attempts · Certificates (PDF+QR) · Payments (Stripe+Paymob+Coupons) · Notifications (FCM) · Mail (Resend) · Community (Comments+Messaging+Socket.IO) · Reviews · Wishlist · Uploads (S3/MinIO presigned) · Search (Algolia) · Admin (Analytics+CMS)

### Frontend
- **Landing**: Navbar, Hero (بتصميم "توهج السراج")، Achievers، Features، Pricing، Footer
- **Auth**: Login / Register
- **Courses**: Catalog + تفاصيل الكورس + Enroll/Checkout
- **Student Dashboard**: الرئيسية، كورساتي، الشهادات، المفضلة، الإشعارات، الملف الشخصي، الواجبات
- **Course Player**: فيديو (Plyr) + تتبع تقدم + تعليقات
- **Exam UI**: تايمر + أسئلة MCQ/Essay + نتيجة
- **Teacher Dashboard**: الرئيسية، كورساتي، إنشاء كورس، إدارة المحتوى (رفع فيديو مباشر لـ S3)، طلاب الكورس، الأرباح
- **Admin Dashboard**: الرئيسية (Analytics)، مراجعة الكورسات، المستخدمين، التصنيفات، الكوبونات، CMS

### الباقي (تحسينات مستقبلية، ليست أساسية للتشغيل)
- صفحة Progress تفصيلية أعمق للطالب
- صفحة تعديل بيانات كورس منشور (المعلم)
- Reports تفصيلية أعمق (الأدمن)
- Dark/Light mode toggle (المشروع دارك فقط حاليًا بتصميم مقصود)
- Live Sessions UI (الموديل موجود في الـ schema، الواجهة لسه)

---

## 🎨 نظام التصميم (Design System)

مستوحى من [abdelmaaboud.com](https://abdelmaaboud.com) مع هوية بصرية خاصة بـ "سراج":

| العنصر | القيمة |
|---|---|
| الخلفية | `#0B1220` (كحلي غامق) |
| اللون المميز | `#F5B84A` (ذهبي — لون ضوء السراج) |
| خط العناوين | Cairo (Bold/ExtraBold) |
| خط النصوص | Tajawal |
| العنصر البصري المميز | توهج فانوس SVG متحرك خلف الـ Hero (`components/landing/lamp-signature.tsx`) |

---

## 🛠️ أوامر مفيدة

```bash
# Backend
npm run prisma:studio      # فتح واجهة بصرية لقاعدة البيانات
npm run prisma:migrate     # إنشاء migration جديد بعد تعديل schema.prisma
npm run test               # تشغيل الاختبارات

# Frontend
npm run build               # بناء نسخة الإنتاج
npm run lint                 # فحص الكود
```

## 📦 النشر (Deployment)

- **Frontend** → Vercel (اتصله بمستودع Git، هيكتشف Next.js أوتوماتيك)
- **Backend** → VPS بـ Docker: استخدم `apps/api/Dockerfile` (لسه لازم يُبنى) + `nginx` كـ reverse proxy + `pm2` أو `docker-compose` للتشغيل الدائم
- **Database** → PostgreSQL managed (مثل Supabase, Railway, أو VPS منفصل)
