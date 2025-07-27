export type LeaveType = '연차' | '오전 반차' | '오후 반차' | '휴일 근무' | '대체 휴가';
export type RequestStatus = '승인' | '상신중' | '반려';

export interface LeaveBalance {
  total: number;      // 발생
  used: number;       // 사용
  remaining: number;  // 잔여
}

export interface LeaveRequest {
  id: number;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: RequestStatus;
  requestDate: string;
  approver?: string;
  rejectReason?: string;
}

export interface Employee {
  id: number;
  name: string;
  department: string;
  position: string;
}