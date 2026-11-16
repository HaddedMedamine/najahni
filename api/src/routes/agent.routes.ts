import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  AgentLeadDto,
  AgentLeadStatusDto,
  AgentLeadsQuery,
  AgentOrderDto,
  AgentOrderStatusDto,
  AgentOrdersQuery,
  AgentReplyDto,
} from '../core/agent/agent.dto.js';
import { AgentKeyGuard, AgentService } from '../core/agent/agent.service.js';
import { type AuthUser, CurrentUser, Public, Roles } from '../core/auth/decorators.js';

/** Routes de n8n : l'agent lit la fiche du centre et ajoute des lignes, sans acces aux eleves. */
@ApiTags('agent')
@ApiSecurity('x-agent-key')
@Public()
@UseGuards(AgentKeyGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  @Get('fiche')
  fiche() {
    return this.agent.fiche();
  }

  @Post('reply')
  @HttpCode(200)
  reply(@Body() dto: AgentReplyDto) {
    return this.agent.reply(dto.to, dto.text);
  }

  @Post('leads')
  addLead(@Body() dto: AgentLeadDto) {
    return this.agent.addLead(dto);
  }

  @Post('orders')
  addOrder(@Body() dto: AgentOrderDto) {
    return this.agent.addOrder(dto);
  }
}

@ApiTags('admin / agent')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/agent')
export class AdminAgentController {
  constructor(private readonly agent: AgentService) {}

  @Get('leads')
  leads(@Query() q: AgentLeadsQuery) {
    return this.agent.leads(q);
  }

  @Patch('leads/:id')
  setLeadStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgentLeadStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.agent.setLeadStatus(id, dto.status, user.id);
  }

  @Get('orders')
  orders(@Query() q: AgentOrdersQuery) {
    return this.agent.orders(q);
  }

  @Patch('orders/:id')
  setOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgentOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.agent.setOrderStatus(id, dto.status, user.id);
  }
}
