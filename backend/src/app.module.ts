import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  User,
  Employee,
  Education,
  Experience,
  LeaveRequest,
  LeaveBalance,
  Project,
  ProjectClient,
  ProjectPayment,
  InternalStaff,
  ExternalStaff,
  OpexItem,
  MonthlyOpex,
  YearlyOpex,
  ProjectPPE,
  HRUnitCost,
  CashFlow,
  MonthlyFlow,
  Document,
  ExchangeRate,
  EmployeeHRCost,
} from './entities';
import { EmployeeModule } from './modules/employee/employee.module';
import { ProjectModule } from './modules/project/project.module';
import { CashFlowModule } from './modules/cashflow/cashflow.module';
import { HRCostModule } from './modules/hr-cost/hr-cost.module';
import { OpexModule } from './modules/opex/opex.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExchangeRateModule } from './modules/exchange-rate/exchange-rate.module';
import { PPEModule } from './modules/ppe/ppe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'dev_user',
      password: process.env.DB_PASSWORD || 'dev_password',
      database: process.env.DB_NAME || 'grk_dev',
      entities: [
        User,
        Employee,
        Education,
        Experience,
        LeaveRequest,
        LeaveBalance,
        Project,
        ProjectClient,
        ProjectPayment,
        InternalStaff,
        ExternalStaff,
        OpexItem,
        MonthlyOpex,
        YearlyOpex,
        ProjectPPE,
        HRUnitCost,
        CashFlow,
        MonthlyFlow,
        Document,
        ExchangeRate,
        EmployeeHRCost,
      ],
      synchronize: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    AuthModule,
    EmployeeModule,
    ProjectModule,
    CashFlowModule,
    HRCostModule,
    OpexModule.forRoot(),
    AttendanceModule,
    ExchangeRateModule,
    PPEModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
