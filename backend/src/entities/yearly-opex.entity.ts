import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MonthlyOpex } from './monthly-opex.entity';

@Entity('yearly_opex')
export class YearlyOpex extends BaseEntity {
  @Column({ type: 'int', unique: true })
  year: number; // 연도

  @OneToMany(() => MonthlyOpex, (monthlyOpex) => monthlyOpex.yearlyOpex, {
    cascade: true,
    eager: true,
  })
  months: MonthlyOpex[];
}