import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/checkout.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Coupons')
@ApiBearerAuth('access-token')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: '[Student] Validate a coupon code before checkout' })
  validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.previewForCourse(dto.code, dto.courseId);
  }

  @Post('admin')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Create a new coupon' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] List all coupons' })
  findAll() {
    return this.couponsService.findAll();
  }

  @Get('admin/analytics')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Coupon Analytics — usage and revenue impact per coupon' })
  getAnalytics() {
    return this.couponsService.getAnalytics();
  }

  @Patch('admin/:id/toggle')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Activate/deactivate a coupon' })
  toggleActive(@Param('id') id: string) {
    return this.couponsService.toggleActive(id);
  }

  @Delete('admin/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Delete a coupon' })
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
