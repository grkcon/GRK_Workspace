import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

export enum LeaveType {
  ANNUAL = '연차',
  MORNING_HALF = '오전 반차',
  AFTERNOON_HALF = '오후 반차',
  HOLIDAY_WORK = '휴일 근무',
  SUBSTITUTE = '대체 휴가',
}

export enum RequestStatus {
  APPROVED = '승인',
  PENDING = '상신중',
  REJECTED = '반려',
}

@Entity('leave_requests')
export class LeaveRequest extends BaseEntity {
  @Column({
    type: 'enum',
    enum: LeaveType,
  })
  type: LeaveType;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  days: number; // 사용일수

  @Column({ type: 'text' })
  reason: string; // 사유

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  requestDate: Date; // 신청일

  @Column({ type: 'varchar', length: 100, nullable: true })
  approver?: string; // 승인자

  @Column({ type: 'text', nullable: true })
  rejectReason?: string; // 반려사유

  @ManyToOne(() => Employee, (employee) => employee.leaveRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}