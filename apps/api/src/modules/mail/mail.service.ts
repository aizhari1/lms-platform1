import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly fromAddress: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    const fromName = this.config.get<string>('MAIL_FROM_NAME', 'SIRAJ LMS');
    const fromEmail = this.config.get<string>(
      'MAIL_FROM_ADDRESS',
      'no-reply@lms.example.com',
    );
    this.fromAddress = `${fromName} <${fromEmail}>`;
  }

  /**
   * Email Templates — checks for an admin-edited override in the DB
   * first; falls back to the hardcoded default so email keeps working
   * even before an admin has customized anything.
   */
  private async renderTemplate(
    key: string,
    fallback: { subject: string; html: string },
    variables: Record<string, string> = {},
  ): Promise<{ subject: string; html: string }> {
    const override = await this.prisma.emailTemplate.findUnique({ where: { key } }).catch(() => null);
    if (!override) return fallback;

    const interpolate = (text: string) =>
      Object.entries(variables).reduce(
        (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, v),
        text,
      );

    return { subject: interpolate(override.subject), html: interpolate(override.bodyHtml) };
  }

  async sendWelcomeEmail(to: string, fullName: string): Promise<void> {
    const { subject, html } = await this.renderTemplate(
      'WELCOME',
      {
        subject: 'مرحبًا بك في المنصة 🎉',
        html: `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right;">
            <h2>أهلاً بك، {{fullName}}!</h2>
            <p>تم إنشاء حسابك بنجاح. يمكنك الآن تصفح الكورسات والبدء في التعلم.</p>
          </div>
        `,
      },
      { fullName },
    );
    await this.send({ to, subject, html });
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: 'إعادة تعيين كلمة المرور',
      html: `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right;">
          <h2>طلب إعادة تعيين كلمة المرور</h2>
          <p>اضغط على الرابط التالي لإعادة تعيين كلمة مرورك. هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;">
            إعادة تعيين كلمة المرور
          </a>
          <p style="color:#888;font-size:12px;margin-top:16px;">
            إذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة بأمان.
          </p>
        </div>
      `,
    });
  }

  async sendCourseApprovedEmail(
    to: string,
    teacherName: string,
    courseTitle: string,
  ): Promise<void> {
    const { subject, html } = await this.renderTemplate(
      'COURSE_APPROVED',
      {
        subject: 'تمت الموافقة على كورسك ✅',
        html: `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right;">
            <h2>مبروك، {{teacherName}}!</h2>
            <p>تمت مراجعة والموافقة على كورس "<strong>{{courseTitle}}</strong>" وهو الآن منشور على المنصة.</p>
          </div>
        `,
      },
      { teacherName, courseTitle },
    );
    await this.send({ to, subject, html });
  }

  async sendInvoiceEmail(
    to: string,
    orderNo: string,
    courseTitle: string,
    totalAmount: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: `فاتورة الطلب #${orderNo}`,
      html: `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right;">
          <h2>تم الدفع بنجاح ✅</h2>
          <p>شكرًا لشرائك كورس "<strong>${courseTitle}</strong>".</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr><td style="padding:8px;border:1px solid #eee;">رقم الطلب</td><td style="padding:8px;border:1px solid #eee;">${orderNo}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;">الإجمالي</td><td style="padding:8px;border:1px solid #eee;">${totalAmount}</td></tr>
          </table>
        </div>
      `,
    });
  }

  /** Generic send, used by teacher-facing Bulk Email. */
  async sendCustomEmail(to: string, subject: string, bodyHtml: string): Promise<void> {
    await this.send({
      to,
      subject,
      html: `<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right;">${bodyHtml}</div>`,
    });
  }

  private async send(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${params.to}`, error as Error);
    }
  }
}
