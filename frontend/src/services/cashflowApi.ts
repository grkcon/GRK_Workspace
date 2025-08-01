import { apiClient } from './api';

export interface CashFlow {
  id: number;
  year: number;
  projectName: string;
  client: string;
  totalRevenue: number;
  totalExpense: number;
  netCashFlow: number;
  monthlyFlows: MonthlyFlow[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyFlow {
  id: number;
  month: number;
  beginningCash: number;
  revenue: number;
  researchRevenue: number;
  laborCost: number;
  indirectOpex: number;
  directOpex: number;
  bonus: number;
  expense: number;
  endingCash: number;
}

export interface CreateCashFlowDto {
  year: number;
  projectName: string;
  client: string;
  monthlyFlows: Array<{
    month: number;
    beginningCash?: number;
    revenue: number;
    researchRevenue: number;
    laborCost: number;
    indirectOpex: number;
    directOpex: number;
    bonus: number;
  }>;
}

export interface UpdateCashFlowDto extends Partial<CreateCashFlowDto> {}

export interface MonthlyCashFlowSummary {
  year: number;
  month: number;
  totalBeginningCash: number;
  totalRevenue: number;
  totalExpense: number;
  totalEndingCash: number;
  projects: Array<{
    projectName: string;
    monthlyFlow: MonthlyFlow;
  }>;
}

export const cashflowApi = {
  getAll: (): Promise<CashFlow[]> => {
    return apiClient.get<CashFlow[]>('/cashflows');
  },

  getById: (id: number): Promise<CashFlow> => {
    return apiClient.get<CashFlow>(`/cashflows/${id}`);
  },

  getByYear: (year: number): Promise<CashFlow[]> => {
    return apiClient.get<CashFlow[]>(`/cashflows/year/${year}`);
  },

  getMonthlySummary: (year: number, month: number): Promise<MonthlyCashFlowSummary> => {
    return apiClient.get<MonthlyCashFlowSummary>(`/cashflows/monthly/${year}/${month}`);
  },

  create: (cashflow: CreateCashFlowDto): Promise<CashFlow> => {
    return apiClient.post<CashFlow>('/cashflows', cashflow);
  },

  update: (id: number, cashflow: UpdateCashFlowDto): Promise<CashFlow> => {
    return apiClient.put<CashFlow>(`/cashflows/${id}`, cashflow);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/cashflows/${id}`);
  },
};