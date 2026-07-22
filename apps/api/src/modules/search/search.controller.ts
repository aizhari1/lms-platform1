import { Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SearchService } from './search.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Search')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('reindex')
  @ApiOperation({ summary: '[Admin] Rebuild the entire Algolia course index' })
  async reindex() {
    const count = await this.searchService.reindexAllPublishedCourses();
    return { message: `Reindexed ${count} courses` };
  }
}
