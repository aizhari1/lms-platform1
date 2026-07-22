import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { StripeService } from './providers/stripe.service';
import { PaymobService } from './providers/paymob.service';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { UploadsModule } from '../uploads/uploads.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DiscountCampaignsModule } from '../discount-campaigns/discount-campaigns.module';

@Module({
  imports: [EnrollmentsModule, UploadsModule, NotificationsModule, DiscountCampaignsModule],
  controllers: [PaymentsController, CouponsController],
  providers: [PaymentsService, CouponsService, StripeService, PaymobService],
  exports: [PaymentsService, CouponsService],
})
export class PaymentsModule {}
