import { apiClient } from './api';

export interface OpexItem {
  id: number;
  category: 'OFFICE_SUPPLIES' | 'EQUIPMENT' | 'SOFTWARE' | 'MAINTENANCE' | 'UTILITIES' | 'OTHER';
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  description?: string;
  purchaseDate: Date;
  vendor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOpexDto {
  category: 'OFFICE_SUPPLIES' | 'EQUIPMENT' | 'SOFTWARE' | 'MAINTENANCE' | 'UTILITIES' | 'OTHER';
  itemName: string;
  unitPrice: number;
  quantity: number;
  description?: string;
  purchaseDate: string;
  vendor?: string;
}

export interface UpdateOpexDto extends Partial<CreateOpexDto> {}

export interface OpexSummary {
  category: string;
  totalAmount: number;
  itemCount: number;
}

export const opexApi = {
  getAll: (): Promise<OpexItem[]> => {
    return apiClient.get<OpexItem[]>('/opex');
  },

  getById: (id: number): Promise<OpexItem> => {
    return apiClient.get<OpexItem>(`/opex/${id}`);
  },

  getByCategory: (category: string): Promise<OpexItem[]> => {
    return apiClient.get<OpexItem[]>(`/opex/category/${category}`);
  },

  getByDateRange: (startDate: string, endDate: string): Promise<OpexItem[]> => {
    return apiClient.get<OpexItem[]>(`/opex/date-range?start=${startDate}&end=${endDate}`);
  },

  getSummary: (): Promise<OpexSummary[]> => {
    return apiClient.get<OpexSummary[]>('/opex/summary');
  },

  create: (opex: CreateOpexDto): Promise<OpexItem> => {
    return apiClient.post<OpexItem>('/opex', opex);
  },

  update: (id: number, opex: UpdateOpexDto): Promise<OpexItem> => {
    return apiClient.put<OpexItem>(`/opex/${id}`, opex);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/opex/${id}`);
  },
};