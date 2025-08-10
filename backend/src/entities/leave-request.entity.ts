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
  days: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ type: 'date' })
  requestDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  approver?: string;

  @Column({ type: 'text', nullable: true })
  rejectReason?: string;

  @ManyToOne(() => Employee, (employee) => employee.leaveRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
