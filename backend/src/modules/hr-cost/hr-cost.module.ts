import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HRUnitCost, Employee } from '../../entities';
import { HRCostService } from './services/hr-cost.service';
import { HRCostController } from './controllers/hr-cost.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HRUnitCost, Employee])],
  controllers: [HRCostController],
  providers: [HRCostService],
  exports: [HRCostService],
})
export class HRCostModule {}