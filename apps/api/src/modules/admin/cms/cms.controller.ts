import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CmsService } from './cms.service';
import { CreateCmsPageDto, UpdateCmsPageDto } from '../dto/cms-page.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('CMS')
@Controller()
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Public()
  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get a published static page (e.g. about-us, terms)' })
  findPublished(@Param('slug') slug: string) {
    return this.cmsService.findPublishedBySlug(slug);
  }

  @Get('admin/cms/pages')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] List all CMS pages' })
  findAll() {
    return this.cmsService.findAll();
  }

  @Post('admin/cms/pages')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Create a static page' })
  create(@Body() dto: CreateCmsPageDto) {
    return this.cmsService.create(dto);
  }

  @Patch('admin/cms/pages/:id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Update a static page' })
  update(@Param('id') id: string, @Body() dto: UpdateCmsPageDto) {
    return this.cmsService.update(id, dto);
  }

  @Delete('admin/cms/pages/:id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Delete a static page' })
  remove(@Param('id') id: string) {
    return this.cmsService.remove(id);
  }
}
