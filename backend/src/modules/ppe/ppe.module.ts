import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectPPE } from '../../entities/project-ppe.entity';
import { Project } from '../../entities/project.entity';
import { OpexItem } from '../../entities/opex-item.entity';
import { PPEController } from './controllers/ppe.controller';
import { PPEService } from './services/ppe.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectPPE, Project, OpexItem])],
  controllers: [PPEController],
  providers: [PPEService],
  exports: [PPEService],
})
export class PPEModule {}
