import { Module } from '@nestjs/common';
import { DiscountCampaignsController } from './discount-campaigns.controller';
import { DiscountCampaignsService } from './discount-campaigns.service';

@Module({
  controllers: [DiscountCampaignsController],
  providers: [DiscountCampaignsService],
  exports: [DiscountCampaignsService],
})
export class DiscountCampaignsModule {}
