import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Role, RefundStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { StripeService } from './providers/stripe.service';
import { PaymobService } from './providers/paymob.service';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly paymobService: PaymobService,
  ) {}

  @Post('checkout')
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Student] Start checkout for a course (Stripe or Paymob)' })
  checkout(
    @CurrentUser() user: AuthenticatedUser & { phone?: string },
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.paymentsService.createCheckout(
      user.id,
      user.email,
      user.fullName,
      user.phone ?? null,
      dto,
    );
  }

  @Get('my-orders')
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Student] View my order/invoice history' })
  myOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findMyOrders(user.id);
  }

  @Get('orders/:orderId/timeline')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Order Timeline — every dated event for one order' })
  orderTimeline(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.getOrderTimeline(orderId, user);
  }

  @Get('orders/:orderId/logs')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Payment Logs — raw audit trail for one order' })
  orderLogs(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentLogs(orderId);
  }

  @Post('orders/:orderId/refund-request')
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Student] Request a refund for a paid order' })
  requestRefund(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('reasonAr') reasonAr: string,
  ) {
    return this.paymentsService.requestRefund(user.id, orderId, reasonAr);
  }

  @Get('my-refund-requests')
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Student] My refund requests' })
  myRefundRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findMyRefundRequests(user.id);
  }

  @Get('refund-requests')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] List refund requests, optionally filtered by status' })
  allRefundRequests(@Query('status') status?: RefundStatus) {
    return this.paymentsService.findAllRefundRequests(status);
  }

  @Patch('refund-requests/:refundRequestId')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Approve or reject a refund request' })
  resolveRefund(
    @Param('refundRequestId') refundRequestId: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Body('adminNote') adminNote?: string,
  ) {
    return this.paymentsService.resolveRefundRequest(
      refundRequestId,
      status as any,
      adminNote,
    );
  }

  @Get('my-earnings')
  @Roles(Role.TEACHER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Teacher] View my earnings from course sales' })
  myEarnings(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findMyEarnings(user.id);
  }

  // -----------------------------------------------------------------
  // WEBHOOKS — public but cryptographically verified, never trust
  // the payload without checking the signature/HMAC first.
  // -----------------------------------------------------------------
  @Public()
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook (signature-verified, not for direct use)' })
  async stripeWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException(
        'Raw body is required for Stripe signature verification — ensure the raw body middleware is configured for this route',
      );
    }

    const event = this.stripeService.constructWebhookEvent(req.rawBody, signature);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: { orderId?: string } };
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await this.paymentsService.handleStripeWebhookEvent(orderId);
      }
    }

    return { received: true };
  }

  @Public()
  @Post('webhooks/paymob')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paymob transaction callback (HMAC-verified, not for direct use)' })
  async paymobWebhook(@Body() body: Record<string, any>) {
    const receivedHmac = body?.hmac;
    const transaction = body?.obj ?? body;

    const isValid = this.paymobService.verifyHmac(transaction, receivedHmac);
    if (!isValid) {
      throw new BadRequestException('Invalid Paymob HMAC signature');
    }

    await this.paymentsService.handlePaymobWebhook(transaction);
    return { received: true };
  }
}
