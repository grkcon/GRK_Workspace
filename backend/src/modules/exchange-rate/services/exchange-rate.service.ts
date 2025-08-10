import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from '../../../entities/exchange-rate.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(
    @InjectRepository(ExchangeRate)
    private exchangeRateRepository: Repository<ExchangeRate>,
  ) {}

  // 현재 USD/KRW 환율 조회
  async getCurrentUSDToKRW() {
    const today = new Date().toISOString().split('T')[0];
    
    let todayRate = await this.exchangeRateRepository.findOne({
      where: { currency: 'USD', date: today },
    });

    // 오늘 환율이 없으면 외부 API에서 가져오기
    if (!todayRate) {
      todayRate = await this.fetchAndSaveExchangeRate('USD');
    }

    // 전일 대비 변동률 계산
    if (todayRate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];
      
      const yesterdayRate = await this.exchangeRateRepository.findOne({
        where: { currency: 'USD', date: yesterdayDate },
      });

      if (yesterdayRate) {
        const changePercent = ((Number(todayRate.rate) - Number(yesterdayRate.rate)) / Number(yesterdayRate.rate)) * 100;
        todayRate.change = Number(changePercent.toFixed(2));
      }
    }

    return {
      usdToKrw: {
        currency: todayRate?.currency || 'USD',
        rate: Number(todayRate?.rate || 1300),
        date: todayRate?.date || today,
        change: todayRate?.change || 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  // 외부 API에서 환율 정보 가져오기
  private async fetchAndSaveExchangeRate(currency: string): Promise<ExchangeRate | null> {
    try {
      // exchangerate-api.com 사용 (무료)
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
      const data = await response.json();
      
      if (data.rates && data.rates.KRW) {
        const today = new Date().toISOString().split('T')[0];
        
        const exchangeRate = this.exchangeRateRepository.create({
          currency,
          rate: data.rates.KRW,
          date: today,
          source: 'exchangerate-api',
        });

        return await this.exchangeRateRepository.save(exchangeRate);
      }
    } catch (error) {
      this.logger.error(`환율 정보 가져오기 실패: ${error.message}`);
    }
    
    return null;
  }

  // 매일 오전 9시에 환율 업데이트 (한국 시간 기준)
  @Cron('0 9 * * *', {
    timeZone: 'Asia/Seoul',
  })
  async updateDailyExchangeRates() {
    this.logger.log('일일 환율 업데이트 시작');
    
    try {
      await this.fetchAndSaveExchangeRate('USD');
      this.logger.log('USD/KRW 환율 업데이트 완료');
    } catch (error) {
      this.logger.error(`환율 업데이트 실패: ${error.message}`);
    }
  }

  // 특정 날짜 환율 조회
  async getRateByDate(currency: string, date: string) {
    return await this.exchangeRateRepository.findOne({
      where: { currency, date },
    });
  }

  // 최근 7일 환율 히스토리
  async getRecentRates(currency: string = 'USD') {
    return await this.exchangeRateRepository.find({
      where: { currency },
      order: { date: 'DESC' },
      take: 7,
    });
  }
}