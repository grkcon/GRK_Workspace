import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashFlow, MonthlyFlow } from '../../entities';
import { CashFlowService } from './services/cashflow.service';
import { CashFlowController } from './controllers/cashflow.controller';
import { CashFlowCalculator } from './calculators/cashflow.calculator';

@Module({
  imports: [TypeOrmModule.forFeature([CashFlow, MonthlyFlow])],
  controllers: [CashFlowController],
  providers: [CashFlowService, CashFlowCalculator],
  exports: [CashFlowService, CashFlowCalculator],
})
export class CashFlowModule {}