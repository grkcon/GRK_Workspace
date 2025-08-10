import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from '../../entities/exchange-rate.entity';
import { ExchangeRateController } from './controllers/exchange-rate.controller';
import { ExchangeRateService } from './services/exchange-rate.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate])],
  controllers: [ExchangeRateController],
  providers: [ExchangeRateService],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}