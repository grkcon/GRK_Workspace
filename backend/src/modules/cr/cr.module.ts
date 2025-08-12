import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../../entities/employee.entity';
import { InternalStaff } from '../../entities/internal-staff.entity';
import { Project } from '../../entities/project.entity';
import { ProjectPPE } from '../../entities/project-ppe.entity';
import { CRController } from './controllers/cr.controller';
import { CRService } from './services/cr.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      InternalStaff,
      Project,
      ProjectPPE,
    ]),
  ],
  controllers: [CRController],
  providers: [CRService],
  exports: [CRService],
})
export class CRModule {}