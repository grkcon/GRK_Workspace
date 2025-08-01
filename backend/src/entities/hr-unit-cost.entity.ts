import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

@Entity('hr_unit_costs')
export class HRUnitCost extends BaseEntity {
  @Column({ type: 'decimal', precision: 15, scale: 0 })
  annualSalary: number; // 연봉

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  socialInsurance: number; // 4대보험

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  retirementPension: number; // 퇴직금

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  companyBurden: number; // 회사 부담금액

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  monthlyCost: number; // 월 원가

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  bonus: number; // 상여금

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  fixedLaborCost: number; // 고정 인건비

  @Column({ type: 'int' })
  year: number; // 연도

  @OneToOne(() => Employee, (employee) => employee.hrUnitCost, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}