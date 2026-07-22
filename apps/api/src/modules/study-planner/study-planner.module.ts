import { Module } from '@nestjs/common';
import { StudyPlannerController } from './study-planner.controller';
import { StudyPlannerService } from './study-planner.service';

@Module({
  controllers: [StudyPlannerController],
  providers: [StudyPlannerService],
  exports: [StudyPlannerService],
})
export class StudyPlannerModule {}
