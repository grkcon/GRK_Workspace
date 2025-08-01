import { Entity, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Education } from './education.entity';
import { Experience } from './experience.entity';
import { LeaveRequest } from './leave-request.entity';
import { LeaveBalance } from './leave-balance.entity';
import { HRUnitCost } from './hr-unit-cost.entity';
import { InternalStaff } from './internal-staff.entity';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  RESIGNED = 'RESIGNED',
}

@Entity('employees')
export class Employee extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  empNo: string; // 사번

  @Column({ type: 'varchar', length: 100 })
  position: string; // 직급

  @Column({ type: 'varchar', length: 100 })
  rank: string; // 직책

  @Column({ type: 'varchar', length: 100 })
  department: string; // 부서

  @Column({ type: 'varchar', length: 20 })
  tel: string; // 전화번호

  @Column({ type: 'int', nullable: true })
  age?: number; // 나이

  @Column({ type: 'decimal', precision: 10, scale: 0, nullable: true })
  monthlySalary?: number; // 월급

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  @Column({ type: 'date' })
  joinDate: Date; // 입사일

  @Column({ type: 'date', nullable: true })
  endDate?: Date; // 퇴사일

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ssn?: string; // 주민등록번호 (암호화 필요)

  @Column({ type: 'decimal', precision: 10, scale: 0, nullable: true })
  salary?: number; // 급여

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankAccount?: string; // 계좌번호

  @OneToMany(() => Education, (education) => education.employee, {
    cascade: true,
    eager: true,
  })
  education: Education[];

  @OneToMany(() => Experience, (experience) => experience.employee, {
    cascade: true,
    eager: true,
  })
  experience: Experience[];

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.employee)
  leaveRequests: LeaveRequest[];

  @OneToOne(() => LeaveBalance, (leaveBalance) => leaveBalance.employee, {
    cascade: true,
  })
  leaveBalance: LeaveBalance;

  @OneToOne(() => HRUnitCost, (hrUnitCost) => hrUnitCost.employee)
  hrUnitCost: HRUnitCost;

  @OneToMany(() => InternalStaff, (internalStaff) => internalStaff.employee)
  projectAssignments: InternalStaff[];
}