import { Module } from '@nestjs/common';
import { AdminAgentController, AgentController } from '../../routes/agent.routes.js';
import { AgentKeyGuard, AgentService } from './agent.service.js';

@Module({
  controllers: [AgentController, AdminAgentController],
  providers: [AgentService, AgentKeyGuard],
})
export class AgentModule {}
