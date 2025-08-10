import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Project,
  ProjectClient,
  ProjectPayment,
  InternalStaff,
  ExternalStaff,
  ProjectPPE,
} from '../../entities';
import { ProjectService } from './services/project.service';
import { ProjectController } from './controllers/project.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectClient,
      ProjectPayment,
      InternalStaff,
      ExternalStaff,
      ProjectPPE,
    ]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
