import { apiClient } from './api';

export interface Employee {
  id: number;
  emp_no: string;
  name: string;
  department: string;
  position: string;
  totalCR: number;
}

export interface CRDetail {
  employeeId: number;
  projectName: string;
  projectRevenue: number;
  costWeight: number;
  cr: number;
}

export const crApi = {
  // 직원별 CR 목록 조회
  getEmployeeCRList: async (): Promise<Employee[]> => {
    return await apiClient.get<Employee[]>('/cr');
  },

  // 직원 CR 상세 내역 조회
  getEmployeeCRDetails: async (employeeId: number): Promise<CRDetail[]> => {
    return await apiClient.get<CRDetail[]>(`/cr/${employeeId}/details`);
  },
};