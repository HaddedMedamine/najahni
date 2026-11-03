import { Module } from '@nestjs/common';
import { AdminAccountsController } from '../../routes/admin/accounts.routes.js';
import { AdminGroupsController } from '../../routes/admin/groups.routes.js';
import { AdminParentsController } from '../../routes/admin/parents.routes.js';
import { AdminPaymentsController } from '../../routes/admin/payments.routes.js';
import { AdminRoomsController } from '../../routes/admin/rooms.routes.js';
import { AdminSessionsController } from '../../routes/admin/sessions.routes.js';
import { AdminStudentsController } from '../../routes/admin/students.routes.js';
import { AdminTeachersController } from '../../routes/admin/teachers.routes.js';
import { AdminWhatsappController } from '../../routes/admin/whatsapp.routes.js';
import { AccountsService } from './accounts.service.js';
import { GroupsService } from './groups.service.js';
import { ParentsService } from './parents.service.js';
import { PaymentsService } from './payments.service.js';
import { RoomsService } from './rooms.service.js';
import { SessionsService } from './sessions.service.js';
import { StudentsService } from './students.service.js';
import { TeachersService } from './teachers.service.js';
import { AdminWhatsappService } from './whatsapp.service.js';

@Module({
  controllers: [
    AdminStudentsController,
    AdminParentsController,
    AdminTeachersController,
    AdminGroupsController,
    AdminRoomsController,
    AdminAccountsController,
    AdminSessionsController,
    AdminPaymentsController,
    AdminWhatsappController,
  ],
  providers: [
    StudentsService,
    ParentsService,
    TeachersService,
    GroupsService,
    RoomsService,
    AccountsService,
    SessionsService,
    PaymentsService,
    AdminWhatsappService,
  ],
})
export class AdminModule {}
