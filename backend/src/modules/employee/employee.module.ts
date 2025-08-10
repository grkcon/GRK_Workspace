import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Employee,
  Education,
  Experience,
  LeaveBalance,
  LeaveRequest,
  Document,
  EmployeeHRCost,
} from '../../entities';
import { EmployeeService } from './services/employee.service';
import { DocumentService } from './services/document.service';
import { EmployeeHRCostService } from './services/hr-cost.service';
import { EmployeeController } from './controllers/employee.controller';
import { OpexModule } from '../opex/opex.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      Education,
      Experience,
      LeaveBalance,
      LeaveRequest,
      Document,
      EmployeeHRCost,
    ]),
    forwardRef(() => OpexModule), // OpexModule을 import하여 OpexService 사용
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, DocumentService, EmployeeHRCostService],
  exports: [EmployeeService, DocumentService, EmployeeHRCostService],
})
export class EmployeeModule {}
