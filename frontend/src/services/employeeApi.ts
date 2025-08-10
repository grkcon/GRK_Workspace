import { apiClient } from './api';
import { Employee } from '../types/employee';

export interface CreateEmployeeDto {
  empNo?: string; // 자동 생성되므로 선택사항
  name: string;
  position: string;
  rank: string;
  department: string;
  tel: string;
  email: string;
  age?: number;
  joinDate: string;
  endDate?: string;
  monthlySalary?: number;
  status?: string;
  ssn?: string;
  bankAccount?: string;
  education?: Array<{
    degree: string;
    major: string;
    school: string;
  }>;
  experience?: Array<{
    company: string;
    department: string;
    position: string;
  }>;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {}

export const employeeApi = {
  getAll: (): Promise<Employee[]> => {
    return apiClient.get<Employee[]>('/employees');
  },

  getById: (id: number): Promise<Employee> => {
    return apiClient.get<Employee>(`/employees/${id}`);
  },

  getByEmpNo: (empNo: string): Promise<Employee> => {
    return apiClient.get<Employee>(`/employees/empno/${empNo}`);
  },

  getActive: (): Promise<Employee[]> => {
    return apiClient.get<Employee[]>('/employees/active');
  },

  getByDepartment: (department: string): Promise<Employee[]> => {
    return apiClient.get<Employee[]>(`/employees?department=${department}`);
  },

  create: (employee: CreateEmployeeDto): Promise<Employee> => {
    return apiClient.post<Employee>('/employees', employee);
  },

  update: (id: number, employee: UpdateEmployeeDto): Promise<Employee> => {
    return apiClient.patch<Employee>(`/employees/${id}`, employee);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/employees/${id}`);
  },

  restore: (id: number): Promise<Employee> => {
    return apiClient.post<Employee>(`/employees/${id}/restore`, {});
  },

  getDeleted: (): Promise<Employee[]> => {
    return apiClient.get<Employee[]>('/employees/deleted/list');
  },

  // 해당 월 기준 재직 직원수 조회
  getActiveEmployeeCountByMonth: (year: number, month: number): Promise<{
    year: number;
    month: number;
    activeEmployeeCount: number;
  }> => {
    return apiClient.get<{
      year: number;
      month: number;
      activeEmployeeCount: number;
    }>(`/employees/active-count/${year}/${month}`);
  },

  // HR Cost 관련 API
  getHRCost: (id: number, year: number): Promise<any> => {
    return apiClient.get<any>(`/employees/${id}/hr-cost/${year}`);
  },

  getHRCostByMonth: (id: number, year: number, month: number): Promise<any> => {
    return apiClient.get<any>(`/employees/${id}/hr-cost/${year}/${month}`);
  },

  updateHRCost: (id: number, year: number, data: any): Promise<any> => {
    return apiClient.patch<any>(`/employees/${id}/hr-cost/${year}`, data);
  },

  // 모든 직원의 HR Cost 조회
  getAllHRCostByMonth: (year: number, month: number): Promise<Array<{
    employee: {
      id: number;
      name: string;
      position: string;
      department: string;
      monthlySalary: string;
    };
    hrCost: any;
  }>> => {
    return apiClient.get<Array<{
      employee: {
        id: number;
        name: string;
        position: string;
        department: string;
        monthlySalary: string;
      };
      hrCost: any;
    }>>(`/employees/hr-cost-all/${year}/${month}`);
  },
};