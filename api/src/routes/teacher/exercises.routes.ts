import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateExerciseDto, UpdateExerciseDto } from '../../actors/teacher/dto/exercises.dto.js';
import { TeacherExercisesService } from '../../actors/teacher/teacher-exercises.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';
import { MAX_FILE_SIZE, MAX_FILES } from '../../core/storage/storage.service.js';

@ApiTags('enseignant / exercices')
@ApiBearerAuth()
@Roles('TEACHER')
@Controller('teacher/exercises')
export class TeacherExercisesController {
  constructor(private readonly exercises: TeacherExercisesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.exercises.list(user.id);
  }

  /** Publier un exercice (fichiers PDF / images / Word) pour mes groupes d'un niveau. */
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'level', 'groupIds', 'files'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        level: { type: 'string', example: 'Bac' },
        groupIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', MAX_FILES, { limits: { fileSize: MAX_FILE_SIZE } }))
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateExerciseDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.exercises.create(user.id, dto, files);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.exercises.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.exercises.remove(user.id, id);
  }

  @Get(':id/files/:fileId')
  file(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.exercises.file(user.id, id, fileId);
  }
}
