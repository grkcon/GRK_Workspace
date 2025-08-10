import { apiClient } from './api';
import { YearlyOpex, CreateYearlyOpexDto, UpdateYearlyOpexDto, OpexType } from '../types/opex';

export interface OpexSummary {
  category: string;
  totalAmount: number;
  itemCount: number;
}

export const opexApi = {
  getAll: (): Promise<YearlyOpex[]> => {
    return apiClient.get<YearlyOpex[]>('/opex');
  },

  getById: (id: number): Promise<YearlyOpex> => {
    return apiClient.get<YearlyOpex>(`/opex/${id}`);
  },

  getByYear: (year: number): Promise<YearlyOpex> => {
    return apiClient.get<YearlyOpex>(`/opex/year/${year}`);
  },

  getSummary: (year: number): Promise<OpexSummary[]> => {
    return apiClient.get<OpexSummary[]>(`/opex/year/${year}/summary`);
  },

  getMonthlyTotal: (year: number, month: number): Promise<number> => {
    return apiClient.get<number>(`/opex/year/${year}/month/${month}/total`);
  },

  updateMonthData: (year: number, month: number, data: any): Promise<any> => {
    return apiClient.put<any>(`/opex/year/${year}/month/${month}`, data);
  },

  confirmMonth: (year: number, month: number): Promise<any> => {
    return apiClient.patch<any>(`/opex/year/${year}/month/${month}/confirm`, {});
  },

  create: (opex: CreateYearlyOpexDto): Promise<YearlyOpex> => {
    return apiClient.post<YearlyOpex>('/opex', opex);
  },

  update: (id: number, opex: UpdateYearlyOpexDto): Promise<YearlyOpex> => {
    return apiClient.patch<YearlyOpex>(`/opex/${id}`, opex);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/opex/${id}`);
  },

  getAvailableYears: (): Promise<number[]> => {
    return apiClient.get<number[]>('/opex/available-years');
  },

  // 개별 OpexItem 관리
  getOpexItem: (id: number): Promise<any> => {
    return apiClient.get<any>(`/opex/items/${id}`);
  },

  updateOpexItem: (id: number, data: any): Promise<any> => {
    return apiClient.patch<any>(`/opex/items/${id}`, data);
  },

  deleteOpexItem: (id: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/opex/items/${id}`);
  },
};