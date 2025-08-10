import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './services/attendance.service';
import { AttendanceController } from './controllers/attendance.controller';
import { LeaveRequest, Employee, LeaveBalance } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequest, Employee, LeaveBalance])],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
