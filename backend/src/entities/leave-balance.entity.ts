import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

@Entity('leave_balances')
export class LeaveBalance extends BaseEntity {
  @Column({ type: 'decimal', precision: 4, scale: 1, default: 0 })
  total: number; // 발생

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 0 })
  used: number; // 사용

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 0 })
  remaining: number; // 잔여

  @Column({ type: 'int' })
  year: number; // 연도

  @OneToOne(() => Employee, (employee) => employee.leaveBalance, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
