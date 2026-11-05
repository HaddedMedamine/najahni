import { Module } from '@nestjs/common';
import { StudentCodingController } from '../../routes/student/coding.routes.js';
import { StudentController } from '../../routes/student/student.routes.js';
import { StudentService } from './student.service.js';

@Module({
  controllers: [StudentController, StudentCodingController],
  providers: [StudentService],
})
export class StudentModule {}
