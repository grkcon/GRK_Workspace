import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { YearlyOpex } from './yearly-opex.entity';
import { OpexItem } from './opex-item.entity';

@Entity('monthly_opex')
export class MonthlyOpex extends BaseEntity {
  @Column({ type: 'int' })
  month: number; // 월 (1-12)

  @Column({ type: 'int', default: 0 })
  employeeCount: number; // 인원수

  @Column({ type: 'boolean', default: false })
  confirmed: boolean; // 확정 여부

  @OneToMany(() => OpexItem, (opexItem) => opexItem.monthlyOpex, {
    cascade: true,
  })
  opexItems: OpexItem[];

  @ManyToOne(() => YearlyOpex, (yearlyOpex) => yearlyOpex.months, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'yearly_opex_id' })
  yearlyOpex: YearlyOpex;
}
