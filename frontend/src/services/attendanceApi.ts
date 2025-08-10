import { apiClient } from './api';

export enum LeaveType {
  ANNUAL = '연차',
  MORNING_HALF = '오전 반차',
  AFTERNOON_HALF = '오후 반차',
  HOLIDAY_WORK = '휴일 근무',
  SUBSTITUTE = '대체 휴가'
}

export enum RequestStatus {
  APPROVED = '승인',
  PENDING = '상신중',
  REJECTED = '반려'
}

export interface LeaveRequest {
  id: number;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: RequestStatus;
  requestDate: Date;
  approver?: string;
  rejectReason?: string;
  employee: {
    id: number;
    name: string;
    department: string;
    position: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalance {
  id: number;
  year: number;
  total: number;
  used: number;
  remaining: number;
  employee: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLeaveRequestDto {
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  employeeId: number;
  requestDate?: string;
}

export interface UpdateLeaveRequestDto extends Partial<CreateLeaveRequestDto> {
  status?: RequestStatus;
  approver?: string;
  rejectReason?: string;
}

export const attendanceApi = {
  // Leave Requests API
  createLeaveRequest: (leaveRequest: CreateLeaveRequestDto): Promise<LeaveRequest> => {
    return apiClient.post<LeaveRequest>('/attendance/leave-requests', leaveRequest);
  },

  getAllLeaveRequests: (): Promise<LeaveRequest[]> => {
    return apiClient.get<LeaveRequest[]>('/attendance/leave-requests');
  },

  getLeaveRequestsByEmployee: (employeeId: number): Promise<LeaveRequest[]> => {
    return apiClient.get<LeaveRequest[]>(`/attendance/leave-requests?employeeId=${employeeId}`);
  },

  getLeaveRequestsByStatus: (status: RequestStatus): Promise<LeaveRequest[]> => {
    return apiClient.get<LeaveRequest[]>(`/attendance/leave-requests?status=${status}`);
  },

  getLeaveRequestById: (id: number): Promise<LeaveRequest> => {
    return apiClient.get<LeaveRequest>(`/attendance/leave-requests/${id}`);
  },

  updateLeaveRequest: (id: number, leaveRequest: UpdateLeaveRequestDto): Promise<LeaveRequest> => {
    return apiClient.patch<LeaveRequest>(`/attendance/leave-requests/${id}`, leaveRequest);
  },

  deleteLeaveRequest: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/attendance/leave-requests/${id}`);
  },

  approveLeaveRequest: (id: number, approver: string): Promise<LeaveRequest> => {
    return apiClient.patch<LeaveRequest>(`/attendance/leave-requests/${id}/approve`, { approver });
  },

  rejectLeaveRequest: (id: number, rejectReason: string): Promise<LeaveRequest> => {
    return apiClient.patch<LeaveRequest>(`/attendance/leave-requests/${id}/reject`, { rejectReason });
  },

  // Leave Balance API
  getLeaveBalance: (employeeId: number): Promise<LeaveBalance> => {
    return apiClient.get<LeaveBalance>(`/attendance/leave-balance/${employeeId}`);
  },
};