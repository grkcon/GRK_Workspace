import { apiClient } from './api';

export enum ProjectStatus {
  ONGOING = '진행중',
  COMPLETED = '완료',
  PLANNED = '계획'
}

export interface ProjectClient {
  id: number;
  name: string;
  contactPerson: string;
  contactNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPayment {
  id: number;
  downPayment?: number;
  middlePayment?: number;
  finalPayment?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InternalStaff {
  id: number;
  name: string;
  role: string;
  startDate: Date;
  endDate: Date;
  utilization?: number;
  exclusionDays?: number;
  totalCost: number;
  monthlyCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalStaff {
  id: number;
  name: string;
  role: string;
  contact: string;
  period: string;
  cost: number;
  memo?: string;
  attachment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPPE {
  id: number;
  revenue: number;
  laborCost: number;
  outsourcingCost: number;
  opexCost: number;
  grossIncome: number;
  grossIncomeRate: number;
  operationIncome: number;
  operationIncomeRate: number;
  profit: number;
  profitRate: number;
  indirectOpex: any[];
  directOpex: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: number;
  name: string;
  client: string;
  startDate: Date;
  endDate: Date;
  pm: string;
  contractValue: number;
  status: ProjectStatus;
  projectClient?: ProjectClient;
  projectPayment?: ProjectPayment;
  internalStaff?: InternalStaff[];
  externalStaff?: ExternalStaff[];
  projectPPE?: ProjectPPE;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectClientDto {
  name: string;
  contactPerson: string;
  contactNumber: string;
}

export interface CreateProjectPaymentDto {
  downPayment?: number;
  middlePayment?: number;
  finalPayment?: number;
}

export interface CreateInternalStaffDto {
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  utilization?: number;
  exclusionDays?: number;
  totalCost: number;
  monthlyCost?: number;
}

export interface CreateExternalStaffDto {
  name: string;
  role: string;
  contact: string;
  period: string;
  cost: number;
  memo?: string;
  attachment?: string;
}

export interface CreateProjectDto {
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  pm: string;
  contractValue: number;
  status?: ProjectStatus;
  projectClient?: CreateProjectClientDto;
  projectPayment?: CreateProjectPaymentDto;
  internalStaff?: CreateInternalStaffDto[];
  externalStaff?: CreateExternalStaffDto[];
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}

export const projectApi = {
  getAll: (): Promise<Project[]> => {
    return apiClient.get<Project[]>('/projects');
  },

  getById: (id: number): Promise<Project> => {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  getByStatus: (status: string): Promise<Project[]> => {
    return apiClient.get<Project[]>(`/projects?status=${status}`);
  },

  getByPM: (pm: string): Promise<Project[]> => {
    return apiClient.get<Project[]>(`/projects?pm=${pm}`);
  },

  create: (project: CreateProjectDto): Promise<Project> => {
    return apiClient.post<Project>('/projects', project);
  },

  update: (id: number, project: UpdateProjectDto): Promise<Project> => {
    return apiClient.patch<Project>(`/projects/${id}`, project);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/projects/${id}`);
  },
};