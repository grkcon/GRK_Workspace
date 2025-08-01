import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YearlyOpex, MonthlyOpex, OpexItem } from '../../entities';
import { OpexService } from './services/opex.service';
import { OpexController } from './controllers/opex.controller';

@Module({
  imports: [TypeOrmModule.forFeature([YearlyOpex, MonthlyOpex, OpexItem])],
  controllers: [OpexController],
  providers: [OpexService],
  exports: [OpexService],
})
export class OpexModule {}