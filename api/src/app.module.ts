import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './actors/admin/admin.module.js';
import { ParentModule } from './actors/parent/parent.module.js';
import { StudentModule } from './actors/student/student.module.js';
import { TeacherModule } from './actors/teacher/teacher.module.js';
import { AgentModule } from './core/agent/agent.module.js';
import { AuditModule } from './core/audit/audit.service.js';
import { AuthModule } from './core/auth/auth.module.js';
import { THROTTLERS } from './core/auth/throttling.js';
import { CodingModule } from './core/coding/coding.service.js';
import { MailModule } from './core/mail/mail.service.js';
import { NotificationsModule } from './core/notifications/notifications.module.js';
import { PrismaModule } from './core/prisma/prisma.module.js';
import { StorageModule } from './core/storage/storage.service.js';
import { HealthController } from './routes/health.routes.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(THROTTLERS),
    PrismaModule,
    AuditModule,
    AuthModule,
    NotificationsModule,
    StorageModule,
    MailModule,
    CodingModule,
    AgentModule,
    AdminModule,
    TeacherModule,
    StudentModule,
    ParentModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
