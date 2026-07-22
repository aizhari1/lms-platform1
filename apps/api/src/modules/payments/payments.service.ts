import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentSource, OrderType, PaymentProvider, PaymentStatus, RefundStatus, Role } from '@prisma/client';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../../database/prisma.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CouponsService } from './coupons.service';
import { StripeService } from './providers/stripe.service';
import { PaymobService } from './providers/paymob.service';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { UploadsService } from '../uploads/uploads.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DiscountCampaignsService } from '../discount-campaigns/discount-campaigns.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly couponsService: CouponsService,
    private readonly stripeService: StripeService,
    private readonly paymobService: PaymobService,
    private readonly uploads: UploadsService,
    private readonly notifications: NotificationsService,
    private readonly discountCampaigns: DiscountCampaignsService,
  ) {}

  // -----------------------------------------------------------------
  // CHECKOUT — creates an Order, then hands off to the chosen provider
  // -----------------------------------------------------------------
  async createCheckout(
    userId: string,
    userEmail: string,
    userFullName: string,
    userPhone: string | null,
    dto: CreateCheckoutDto,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const alreadyEnrolled = await this.enrollmentsService.checkAccess(
      userId,
      dto.courseId,
    );
    if (alreadyEnrolled) {
      throw new ConflictException('You are already enrolled in this course');
    }

    const subtotal = Number(course.discountPrice ?? course.price);
    let discountAmount = 0;
    let couponId: string | undefined;

    // Discount Campaigns — auto-applied, no code needed. Runs before any
    // manual coupon so a storewide sale still stacks with a code.
    const campaignPct = await this.discountCampaigns.getActiveDiscountForCourse(dto.courseId);
    if (campaignPct > 0) {
      discountAmount += subtotal * (campaignPct / 100);
    }

    if (dto.couponCode) {
      const result = await this.couponsService.validateAndCalculateDiscount(
        dto.couponCode,
        dto.courseId,
        subtotal - discountAmount,
      );
      discountAmount += result.discountAmount;
      couponId = result.coupon.id;
    }

    const totalAmount = Math.max(subtotal - discountAmount, 0);

    const order = await this.prisma.order.create({
      data: {
        userId,
        type: OrderType.COURSE,
        courseId: dto.courseId,
        subtotal,
        discountAmount,
        totalAmount,
        currency: course.currency,
        couponId,
        provider: dto.provider,
        status: PaymentStatus.PENDING,
      },
    });

    // Free after discount (e.g. 100% coupon) -> skip the payment gateway
    if (totalAmount === 0) {
      await this.logPaymentEvent(order.id, 'CHECKOUT_CREATED', { provider: dto.provider, totalAmount });
      await this.markOrderAsPaid(order.id);
      return { requiresPayment: false, order };
    }

    if (dto.provider === PaymentProvider.STRIPE) {
      const session = await this.stripeService.createCheckoutSession({
        orderId: order.id,
        courseTitle: course.titleAr,
        amount: totalAmount,
        currency: course.currency,
        customerEmail: userEmail,
      });
      await this.logPaymentEvent(order.id, 'CHECKOUT_CREATED', { provider: 'STRIPE', totalAmount });
      return {
        requiresPayment: true,
        order,
        redirectUrl: session.url,
      };
    }

    if (dto.provider === PaymentProvider.PAYMOB) {
      const { paymentKey, iframeId } = await this.paymobService.createPaymentKey({
        orderId: order.id,
        amountEgp: totalAmount,
        customerEmail: userEmail,
        customerFullName: userFullName,
        customerPhone: userPhone ?? '',
      });
      await this.logPaymentEvent(order.id, 'CHECKOUT_CREATED', { provider: 'PAYMOB', totalAmount });
      return {
        requiresPayment: true,
        order,
        paymentKey,
        iframeId,
      };
    }

    throw new BadRequestException('Unsupported payment provider');
  }

  // -----------------------------------------------------------------
  // WEBHOOK HANDLERS
  // -----------------------------------------------------------------
  async handleStripeWebhookEvent(orderId: string): Promise<void> {
    await this.logPaymentEvent(orderId, 'WEBHOOK_RECEIVED', { provider: 'STRIPE' });
    await this.markOrderAsPaid(orderId);
  }

  async handlePaymobWebhook(payload: Record<string, any>): Promise<void> {
    const merchantOrderId = payload?.order?.merchant_order_id;
    const isSuccess = payload?.success === true || payload?.success === 'true';

    if (!merchantOrderId) {
      this.logger.warn('Paymob webhook missing merchant_order_id');
      return;
    }

    await this.logPaymentEvent(merchantOrderId, 'WEBHOOK_RECEIVED', { provider: 'PAYMOB', isSuccess });

    if (isSuccess) {
      await this.markOrderAsPaid(merchantOrderId);
    } else {
      await this.prisma.order.updateMany({
        where: { id: merchantOrderId, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
      });
      await this.logPaymentEvent(merchantOrderId, 'MARKED_FAILED', {});
    }
  }

  // -----------------------------------------------------------------
  // Shared: mark order paid -> enroll student -> record teacher earning
  // -----------------------------------------------------------------
  private async markOrderAsPaid(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.error(`Order ${orderId} not found while marking as paid`);
      return;
    }
    if (order.status === PaymentStatus.PAID) {
      return; // idempotent — webhook may fire more than once
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    });
    await this.logPaymentEvent(orderId, 'MARKED_PAID', {});

    if (order.couponId) {
      await this.couponsService.incrementUsage(order.couponId);
    }

    if (order.type === OrderType.COURSE && order.courseId) {
      const hasDiscount = Number(order.discountAmount) > 0;
      await this.enrollmentsService.enrollStudent(
        order.userId,
        order.courseId,
        hasDiscount ? EnrollmentSource.COUPON : EnrollmentSource.PURCHASE,
      );

      const course = await this.prisma.course.findUnique({
        where: { id: order.courseId },
      });
      if (course) {
        const commissionPct = 20; // platform commission, could be configurable per teacher
        const netAmount =
          Number(order.totalAmount) * (1 - commissionPct / 100);

        await this.prisma.teacherEarning.create({
          data: {
            teacherId: course.teacherId,
            orderId: order.id,
            amount: order.totalAmount,
            commissionPct,
            netAmount,
          },
        });
      }
    }

    this.logger.log(`Order ${orderId} marked as PAID and fulfilled`);

    // Invoice PDF — generated once, asynchronously-ish but awaited so
    // invoiceUrl is guaranteed to exist by the time the student checks.
    this.generateInvoicePdf(orderId).catch((err) =>
      this.logger.error(`Failed to generate invoice for order ${orderId}: ${err.message}`),
    );
  }

  // -----------------------------------------------------------------
  // PAYMENT LOGS — immutable audit trail
  // -----------------------------------------------------------------
  private async logPaymentEvent(
    orderId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.paymentLog.create({ data: { orderId, event, payload: payload as any } });
  }

  async getPaymentLogs(orderId: string) {
    return this.prisma.paymentLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Order Timeline: every dated event for one order, merged and sorted. */
  async getOrderTimeline(orderId: string, user: { id: string; role: Role }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        refundRequests: true,
        paymentLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You cannot view this order');
    }

    const events: { label: string; date: Date; type: string }[] = [
      { label: 'تم إنشاء الطلب', date: order.createdAt, type: 'ORDER_CREATED' },
      ...order.paymentLogs.map((log) => ({
        label: this.describePaymentEvent(log.event),
        date: log.createdAt,
        type: log.event,
      })),
      ...(order.paidAt
        ? [{ label: 'تم الدفع بنجاح', date: order.paidAt, type: 'PAID' }]
        : []),
      ...order.refundRequests.flatMap((r) => [
        { label: 'تم طلب استرداد المبلغ', date: r.requestedAt, type: 'REFUND_REQUESTED' },
        ...(r.resolvedAt
          ? [
              {
                label: r.status === RefundStatus.APPROVED ? 'تمت الموافقة على الاسترداد' : 'تم رفض طلب الاسترداد',
                date: r.resolvedAt,
                type: `REFUND_${r.status}`,
              },
            ]
          : []),
      ]),
    ];

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private describePaymentEvent(event: string): string {
    const labels: Record<string, string> = {
      CHECKOUT_CREATED: 'بدأ عملية الدفع',
      WEBHOOK_RECEIVED: 'تم استلام تأكيد من بوابة الدفع',
      MARKED_PAID: 'تم تأكيد الدفع',
      MARKED_FAILED: 'فشلت عملية الدفع',
    };
    return labels[event] ?? event;
  }

  // -----------------------------------------------------------------
  // INVOICE PDF
  // -----------------------------------------------------------------
  private async generateInvoicePdf(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { fullName: true, email: true } },
        course: { select: { titleAr: true } },
        coupon: { select: { code: true } },
      },
    });
    if (!order || order.invoiceUrl) return; // already generated, or order missing

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));

    doc.fontSize(22).fillColor('#0f172a').text('Invoice / فاتورة', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).fillColor('#334155');
    doc.text(`Invoice No: ${order.orderNo}`);
    doc.text(`Date: ${(order.paidAt ?? order.createdAt).toLocaleDateString('en-GB')}`);
    doc.text(`Billed to: ${order.user.fullName} (${order.user.email})`);
    doc.moveDown();

    doc.fontSize(13).fillColor('#0f172a').text('Item');
    doc.fontSize(11).fillColor('#334155').text(order.course?.titleAr ?? 'Purchase');
    doc.moveDown();

    doc.text(`Subtotal: ${order.subtotal} ${order.currency}`);
    if (Number(order.discountAmount) > 0) {
      doc.text(
        `Discount${order.coupon ? ` (${order.coupon.code})` : ''}: -${order.discountAmount} ${order.currency}`,
      );
    }
    doc.fontSize(13).fillColor('#0f172a').text(`Total Paid: ${order.totalAmount} ${order.currency}`, {
      underline: true,
    });

    doc.end();
    await new Promise<void>((resolve) => doc.on('end', () => resolve()));
    const pdfBuffer = Buffer.concat(buffers);

    const invoiceUrl = await this.uploads.uploadBuffer(
      `invoices/${order.orderNo}.pdf`,
      pdfBuffer,
      'application/pdf',
    );

    await this.prisma.order.update({ where: { id: orderId }, data: { invoiceUrl } });
  }

  // -----------------------------------------------------------------
  // REFUND REQUESTS
  // -----------------------------------------------------------------
  async requestRefund(studentId: string, orderId: string, reasonAr: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== studentId) {
      throw new ForbiddenException('This is not your order');
    }
    if (order.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    const existing = await this.prisma.refundRequest.findFirst({
      where: { orderId, status: RefundStatus.PENDING },
    });
    if (existing) {
      throw new BadRequestException('A refund request for this order is already pending');
    }

    const refundRequest = await this.prisma.refundRequest.create({
      data: { orderId, studentId, reasonAr },
    });

    await this.logPaymentEvent(orderId, 'REFUND_REQUESTED', { reasonAr });

    return refundRequest;
  }

  async findMyRefundRequests(studentId: string) {
    return this.prisma.refundRequest.findMany({
      where: { studentId },
      orderBy: { requestedAt: 'desc' },
      include: { order: { select: { orderNo: true, totalAmount: true, currency: true } } },
    });
  }

  async findAllRefundRequests(status?: RefundStatus) {
    return this.prisma.refundRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { requestedAt: 'desc' },
      include: {
        order: { select: { orderNo: true, totalAmount: true, currency: true } },
        student: { select: { fullName: true, email: true } },
      },
    });
  }

  /** [Admin] Approving does NOT auto-refund via the gateway (Stripe/Paymob) —
   *  that still needs a manual/console action for now — but it does revoke
   *  the student's course access and marks the order accordingly. */
  async resolveRefundRequest(
    refundRequestId: string,
    status: RefundStatus.APPROVED | RefundStatus.REJECTED,
    adminNote?: string,
  ) {
    const refundRequest = await this.prisma.refundRequest.findUnique({
      where: { id: refundRequestId },
      include: { order: true },
    });
    if (!refundRequest) throw new NotFoundException('Refund request not found');
    if (refundRequest.status !== RefundStatus.PENDING) {
      throw new BadRequestException('This refund request was already resolved');
    }

    const updated = await this.prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: { status, adminNote, resolvedAt: new Date() },
    });

    await this.logPaymentEvent(refundRequest.orderId, `REFUND_${status}`, { adminNote });

    if (status === RefundStatus.APPROVED) {
      await this.prisma.order.update({
        where: { id: refundRequest.orderId },
        data: { status: PaymentStatus.REFUNDED },
      });
      if (refundRequest.order.courseId) {
        await this.prisma.enrollment
          .delete({
            where: {
              studentId_courseId: {
                studentId: refundRequest.studentId,
                courseId: refundRequest.order.courseId,
              },
            },
          })
          .catch(() => undefined); // enrollment may already be gone
      }
    }

    await this.notifications.notify({
      userId: refundRequest.studentId,
      type: 'PAYMENT',
      titleAr: status === RefundStatus.APPROVED ? 'تمت الموافقة على طلب الاسترداد' : 'تم رفض طلب الاسترداد',
      bodyAr: adminNote ?? '',
    });

    return updated;
  }

  // -----------------------------------------------------------------
  // ORDER HISTORY
  // -----------------------------------------------------------------
  async findMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { coupon: { select: { code: true } } },
    });

    // File Access Policies: invoices carry financial PII, so — unlike
    // certificates, which are meant to be freely shareable — they're
    // served via short-lived Signed URLs instead of a permanent link.
    return orders.map((order) => ({
      ...order,
      invoiceUrl: order.invoiceUrl ? this.uploads.getSignedPlaybackUrl(order.invoiceUrl) : null,
    }));
  }

  // -----------------------------------------------------------------
  // TEACHER EARNINGS
  // -----------------------------------------------------------------
  async findMyEarnings(teacherId: string) {
    const [earnings, totals] = await Promise.all([
      this.prisma.teacherEarning.findMany({
        where: { teacherId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.teacherEarning.aggregate({
        where: { teacherId },
        _sum: { netAmount: true },
      }),
    ]);

    const pendingPayout = await this.prisma.teacherEarning.aggregate({
      where: { teacherId, isPaidOut: false },
      _sum: { netAmount: true },
    });

    return {
      earnings,
      totalEarned: totals._sum.netAmount ?? 0,
      pendingPayout: pendingPayout._sum.netAmount ?? 0,
    };
  }
}
