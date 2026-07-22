import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'البريد الإلكتروني غير صالح' }),
  password: z.string().min(8, { message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(3, { message: 'الاسم يجب ألا يقل عن 3 أحرف' }),
    email: z.string().email({ message: 'البريد الإلكتروني غير صالح' }),
    password: z
      .string()
      .min(8, { message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
        message: 'يجب أن تحتوي كلمة المرور على حرف ورقم واحد على الأقل',
      }),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'البريد الإلكتروني غير صالح' }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
