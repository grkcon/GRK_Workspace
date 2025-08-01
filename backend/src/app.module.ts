import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
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
} from './entities';
import { EmployeeModule } from './modules/employee/employee.module';
import { ProjectModule } from './modules/project/project.module';
import { CashFlowModule } from './modules/cashflow/cashflow.module';
import { HRCostModule } from './modules/hr-cost/hr-cost.module';
import { OpexModule } from './modules/opex/opex.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'dev_user',
      password: process.env.DB_PASSWORD || 'dev_password',
      database: process.env.DB_NAME || 'grk_dev',
      entities: [
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
      ],
      synchronize: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    EmployeeModule,
    ProjectModule,
    CashFlowModule,
    HRCostModule,
    OpexModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
