import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DiscountCampaignsService } from './discount-campaigns.service';
import { CreateDiscountCampaignDto } from './dto/create-campaign.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Discount Campaigns')
@Controller('discount-campaigns')
export class DiscountCampaignsController {
  constructor(private readonly campaignsService: DiscountCampaignsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Create a discount campaign (auto-applied, no code needed)' })
  create(@Body() dto: CreateDiscountCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] List all discount campaigns' })
  findAll() {
    return this.campaignsService.findAll();
  }

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Currently active campaigns (for sale banners)' })
  findActive() {
    return this.campaignsService.findActive();
  }

  @Patch(':id/toggle')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Activate/deactivate a campaign' })
  toggleActive(@Param('id') id: string) {
    return this.campaignsService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Delete a campaign' })
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
}
