import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee, Education, Experience, LeaveBalance, LeaveRequest } from '../../entities';
import { EmployeeService } from './services/employee.service';
import { EmployeeController } from './controllers/employee.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      Education,
      Experience,
      LeaveBalance,
      LeaveRequest,
    ]),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}