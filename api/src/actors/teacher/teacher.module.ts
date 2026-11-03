import { Module } from '@nestjs/common';
import { TeacherExercisesController } from '../../routes/teacher/exercises.routes.js';
import { TeacherPaymentsController } from '../../routes/teacher/payments.routes.js';
import { TeacherSessionsController } from '../../routes/teacher/sessions.routes.js';
import { TeacherController } from '../../routes/teacher/teacher.routes.js';
import { TeacherExercisesService } from './teacher-exercises.service.js';
import { TeacherPaymentsService } from './teacher-payments.service.js';
import { TeacherSessionsService } from './teacher-sessions.service.js';
import { TeacherService } from './teacher.service.js';

@Module({
  controllers: [
    TeacherController,
    TeacherSessionsController,
    TeacherPaymentsController,
    TeacherExercisesController,
  ],
  providers: [
    TeacherService,
    TeacherSessionsService,
    TeacherPaymentsService,
    TeacherExercisesService,
  ],
})
export class TeacherModule {}
