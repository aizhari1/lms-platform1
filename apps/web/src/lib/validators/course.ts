import { z } from 'zod';

export const createCourseSchema = z.object({
  titleAr: z.string().min(5, { message: 'العنوان يجب ألا يقل عن 5 أحرف' }),
  subtitleAr: z.string().optional(),
  descriptionAr: z.string().min(20, { message: 'الوصف يجب ألا يقل عن 20 حرفًا' }),
  categoryId: z.string().min(1, { message: 'اختر تصنيفًا' }),
  price: z.coerce.number().min(0, { message: 'السعر لا يمكن أن يكون سالبًا' }),
  discountPrice: z.coerce.number().min(0).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']),
  language: z.enum(['AR', 'EN']),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
