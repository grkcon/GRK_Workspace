import { apiClient } from './api';

export interface PPEData {
  id: number;
  revenue: number; // 매출액
  laborCost: number; // 투입인건비
  outsourcingCost: number; // 외주비용
  opexCost: number; // OPEX
  grossIncome: number; // Gross Income
  grossIncomeRate: number; // Gross Income %
  operationIncome: number; // Operation Income
  operationIncomeRate: number; // Operation Income %
  profit: number; // Profit
  profitRate: number; // Profit %
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    contractAmount: number;
    projectClient?: {
      id: number;
      companyName: string;
      contactPerson: string;
      contactNumber: string;
      email: string;
    };
    projectPayment?: {
      id: number;
      downPayment: number;
      middlePayment: number;
      finalPayment: number;
    };
    internalStaff?: {
      id: number;
      name: string;
      role: string;
      startDate: string;
      endDate: string;
      utilization: number;
      exclusionDays: number;
      totalCost: number;
    }[];
    externalStaff?: {
      id: number;
      name: string;
      role: string;
      contact: string;
      period: string;
      cost: number;
      memo: string;
    }[];
  };
  indirectOpex?: OpexItemData[];
  directOpex?: OpexItemData[];
}

export interface OpexItemData {
  id: number;
  category: string;
  amount: number;
  note?: string;
  type: 'indirect' | 'direct';
}

export interface CreatePPEDto {
  revenue: number;
  laborCost: number;
  outsourcingCost: number;
  opexCost: number;
  indirectOpex?: OpexItemDto[];
  directOpex?: OpexItemDto[];
}

export interface UpdatePPEDto {
  revenue?: number;
  laborCost?: number;
  outsourcingCost?: number;
  opexCost?: number;
  indirectOpex?: OpexItemDto[];
  directOpex?: OpexItemDto[];
}

export interface OpexItemDto {
  id?: number;
  category?: string;
  amount?: number;
  note?: string;
}

export interface PPESummary {
  totalProjects: number;
  totalRevenue: number;
  totalProfit: number;
  avgProfitRate: number;
}

export const ppeApi = {
  // 모든 PPE 조회
  getAll: (): Promise<PPEData[]> => {
    return apiClient.get<PPEData[]>('/ppe');
  },

  // 특정 PPE 조회
  getById: (id: number): Promise<PPEData> => {
    return apiClient.get<PPEData>(`/ppe/${id}`);
  },

  // 프로젝트별 PPE 조회
  getByProjectId: (projectId: number): Promise<PPEData> => {
    return apiClient.get<PPEData>(`/ppe/project/${projectId}`);
  },

  // PPE 생성
  create: (projectId: number, data: CreatePPEDto): Promise<PPEData> => {
    return apiClient.post<PPEData>(`/ppe/project/${projectId}`, data);
  },

  // PPE 업데이트
  update: (id: number, data: UpdatePPEDto): Promise<PPEData> => {
    return apiClient.patch<PPEData>(`/ppe/${id}`, data);
  },

  // PPE 삭제
  delete: (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/ppe/${id}`);
  },

  // PPE 요약 통계
  getSummary: (): Promise<PPESummary> => {
    return apiClient.get<PPESummary>('/ppe/summary');
  },
};