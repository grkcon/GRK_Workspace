import { apiClient } from './api';

export interface Project {
  id: number;
  name: string;
  client: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  description?: string;
  projectMembers?: ProjectMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  id: number;
  employee: {
    id: number;
    name: string;
    empNo: string;
  };
  role: string;
  workRatio: number;
  startDate: Date;
  endDate?: Date;
}

export interface CreateProjectDto {
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  description?: string;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}

export const projectApi = {
  getAll: (): Promise<Project[]> => {
    return apiClient.get<Project[]>('/projects');
  },

  getById: (id: number): Promise<Project> => {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  getActive: (): Promise<Project[]> => {
    return apiClient.get<Project[]>('/projects/active');
  },

  create: (project: CreateProjectDto): Promise<Project> => {
    return apiClient.post<Project>('/projects', project);
  },

  update: (id: number, project: UpdateProjectDto): Promise<Project> => {
    return apiClient.put<Project>(`/projects/${id}`, project);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/projects/${id}`);
  },

  addMember: (projectId: number, memberData: {
    employeeId: number;
    role: string;
    workRatio: number;
    startDate: string;
    endDate?: string;
  }): Promise<ProjectMember> => {
    return apiClient.post<ProjectMember>(`/projects/${projectId}/members`, memberData);
  },

  removeMember: (projectId: number, memberId: number): Promise<void> => {
    return apiClient.delete<void>(`/projects/${projectId}/members/${memberId}`);
  },
};