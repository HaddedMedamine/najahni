import { Module } from '@nestjs/common';
import { StudentController } from '../../routes/student/student.routes.js';
import { StudentService } from './student.service.js';

@Module({
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
