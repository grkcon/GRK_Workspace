import { Controller, Get, Param } from '@nestjs/common';
import { ExchangeRateService } from '../services/exchange-rate.service';

@Controller('exchange-rate')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get('current')
  async getCurrentRate() {
    return await this.exchangeRateService.getCurrentUSDToKRW();
  }

  @Get('date/:date')
  async getRateByDate(@Param('date') date: string) {
    return await this.exchangeRateService.getRateByDate('USD', date);
  }

  @Get('history')
  async getRecentRates() {
    return await this.exchangeRateService.getRecentRates('USD');
  }
}