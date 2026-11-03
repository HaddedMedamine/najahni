import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsappService } from '../whatsapp/whatsapp.service.js';
import { NotificationsService } from './notifications.service.js';

/** Notifications WhatsApp : disponibles partout (seances, admin...). */
@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [WhatsappService, NotificationsService],
  exports: [WhatsappService, NotificationsService],
})
export class NotificationsModule {}
