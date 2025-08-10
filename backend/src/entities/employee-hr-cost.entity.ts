import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

@Entity('employee_hr_costs')
@Unique(['employee', 'year']) // 직원별 연도별 유니크
export class EmployeeHRCost extends BaseEntity {
  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'int' })
  year: number; // 계산 기준 연도

  // 기본 정보 (편집 가능)
  @Column({ type: 'bigint' })
  annualSalary: number; // 연봉 (편집 가능)

  // 기준일 정보 (연도만 편집 가능)
  @Column({ type: 'date' })
  bonusBaseDate: Date; // 상여금 기준일 (MM-DD 고정, 연도만 변경)

  @Column({ type: 'date' })
  performanceBaseDate: Date; // 성과급 기준일 (MM-DD 고정, 연도만 변경)

  // 계산된 급여 정보
  @Column({ type: 'bigint' })
  insuranceRetirement: number; // 4대보험/퇴직금 (연봉의 50%)

  @Column({ type: 'bigint' })
  companyBurden: number; // 회사 부담금액 (연봉 + 4대보험/퇴직금)

  @Column({ type: 'bigint' })
  monthlyBurden: number; // 월 부담액 (회사부담금액 / 12)

  // 상여금 계산 정보
  @Column({ type: 'int' })
  bonusBaseDays: number; // 상여 기준일수

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.05 })
  bonusRate: number; // 상여금 비율 (기본 5%)

  @Column({ type: 'int' })
  performanceBaseDays: number; // PS 기준일수

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  performanceRate: number; // PS 비율 (기본 100%)

  @Column({ type: 'bigint' })
  bonusAmount: number; // 계산된 상여금

  // 기타 비용
  @Column({ type: 'bigint', default: 1700000 })
  welfareCost: number; // 복지비용 (기본 170만원)

  @Column({ type: 'bigint' })
  fixedLaborCost: number; // 고정 인건비 (회사부담금액 + 상여금 + 복지비용)

  @Column({ type: 'bigint' })
  monthlyLaborCost: number; // 월 인력비 (고정인건비 / 12)

  // 배분 정보 (계산된 값들)
  @Column({ type: 'bigint', default: 0 })
  opexAllocation: number; // OPEX 배분

  @Column({ type: 'bigint', default: 0 })
  eps: number; // EPS

  @Column({ type: 'bigint', default: 0 })
  monthlyEps: number; // Monthly EPS

  @Column({ type: 'bigint', default: 0 })
  ecm: number; // ECM

  @Column({ type: 'bigint' })
  finalLaborCost: number; // 최종 인력원가

  // 역할별 조정 비율 (파트너 3.5, 관리자 0.5, 주니어 0.7 등)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  roleMultiplier: number; // 역할별 조정 비율

  @Column({ type: 'bigint', default: 0 })
  adjustedMonthlyLaborCost: number; // 조정된 월 인력비

  @Column({ type: 'bigint', default: 0 })
  adjustedFinalLaborCost: number; // 조정된 최종 인력원가

  // 메모/비고
  @Column({ type: 'text', nullable: true })
  memo: string;

  // 계산 기준 정보
  @Column({ type: 'date' })
  calculationDate: Date; // 계산 기준일
}
