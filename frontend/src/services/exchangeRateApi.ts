import { apiClient } from './api';

export interface ExchangeRate {
  currency: string;
  rate: number;
  date: string;
  change?: number; // 전일 대비 변동률
}

export interface ExchangeRateResponse {
  usdToKrw: ExchangeRate;
  lastUpdated: string;
}

export const exchangeRateApi = {
  // 현재 환율 정보 조회
  getCurrentRate: (): Promise<ExchangeRateResponse> => {
    return apiClient.get<ExchangeRateResponse>('/exchange-rate/current');
  },

  // 특정 날짜 환율 조회
  getRateByDate: (date: string): Promise<ExchangeRate> => {
    return apiClient.get<ExchangeRate>(`/exchange-rate/date/${date}`);
  },

  // 환율 히스토리 조회 (최근 7일)
  getRecentRates: (): Promise<ExchangeRate[]> => {
    return apiClient.get<ExchangeRate[]>('/exchange-rate/history');
  }
};