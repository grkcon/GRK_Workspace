import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MonthlyFlow } from './monthly-flow.entity';

@Entity('cash_flows')
export class CashFlow extends BaseEntity {
  @Column({ type: 'int' })
  year: number; // 연도

  @Column({ type: 'varchar', length: 100 })
  projectName: string; // 프로젝트명

  @Column({ type: 'varchar', length: 100, nullable: true })
  client?: string; // 고객사

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  totalRevenue: number; // 총 수입

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  totalExpense: number; // 총 지출

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  netCashFlow: number; // 순 현금흐름

  @OneToMany(() => MonthlyFlow, (monthlyFlow) => monthlyFlow.cashFlow, {
    cascade: true,
    eager: true,
  })
  monthlyFlows: MonthlyFlow[];
}