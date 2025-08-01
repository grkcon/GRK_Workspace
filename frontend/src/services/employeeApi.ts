import { apiClient } from './api';
import { Employee } from '../types/employee';

export interface CreateEmployeeDto {
  empNo: string;
  name: string;
  position: string;
  rank: string;
  department: string;
  tel: string;
  email: string;
  age: number;
  joinDate: string;
  endDate?: string;
  monthlySalary: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  education?: Array<{
    degree: string;
    major: string;
    school: string;
    graduationYear: number;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
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
    return apiClient.get<Employee[]>(`/employees/department/${department}`);
  },

  create: (employee: CreateEmployeeDto): Promise<Employee> => {
    return apiClient.post<Employee>('/employees', employee);
  },

  update: (id: number, employee: UpdateEmployeeDto): Promise<Employee> => {
    return apiClient.put<Employee>(`/employees/${id}`, employee);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/employees/${id}`);
  },
};