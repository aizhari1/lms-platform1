import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { ExamAttemptsController } from './exam-attempts.controller';
import { ExamAttemptsService } from './exam-attempts.service';

@Module({
  controllers: [ExamsController, ExamAttemptsController],
  providers: [ExamsService, ExamAttemptsService],
  exports: [ExamsService, ExamAttemptsService],
})
export class ExamsModule {}
