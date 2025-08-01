import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CashFlow } from './cash-flow.entity';

@Entity('monthly_flows')
export class MonthlyFlow extends BaseEntity {
  @Column({ type: 'int' })
  month: number; // 월 (1-12)

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  beginningCash: number; // 기초현금

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  revenue: number; // 수입

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  expense: number; // 지출

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  endingCash: number; // 기말현금

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  laborCost: number; // 인력비

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  indirectOpex: number; // 간접비

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  directOpex: number; // 직접비

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  bonus: number; // 상여금

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  researchRevenue: number; // 연구사업 수입

  @ManyToOne(() => CashFlow, (cashFlow) => cashFlow.monthlyFlows, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cash_flow_id' })
  cashFlow: CashFlow;
}