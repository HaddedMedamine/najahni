import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../core/auth/decorators.js';
import { CodingService } from '../../core/coding/coding.service.js';

@ApiTags('admin / coder')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/coding')
export class AdminCodingController {
  constructor(private readonly coding: CodingService) {}

  /** Avancement de tous les eleves qui ont un parcours. */
  @Get('students')
  students() {
    return this.coding.progressOverview();
  }

  @Get('students/:id')
  student(@Param('id', ParseUUIDPipe) id: string) {
    return this.coding.studentDetail(id);
  }
}
