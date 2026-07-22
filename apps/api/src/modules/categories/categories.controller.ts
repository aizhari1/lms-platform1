import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get the full category tree (public, for navigation & filters)' })
  findTree(@Query('includeInactive') includeInactive?: string) {
    return this.categoriesService.findTree(includeInactive === 'true');
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a category by slug' })
  findOneBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findOneBySlug(slug);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Create a new category' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Update a category' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Delete a category (must be empty)' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
