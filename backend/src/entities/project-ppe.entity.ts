import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { OpexItem } from './opex-item.entity';

@Entity('project_ppe')
export class ProjectPPE extends BaseEntity {
  @Column({ type: 'decimal', precision: 15, scale: 0 })
  revenue: number; // 매출액

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  laborCost: number; // 투입인건비

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  outsourcingCost: number; // 외주비용

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  opexCost: number; // OPEX

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  grossIncome: number; // Gross Income

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  grossIncomeRate: number; // Gross Income %

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  operationIncome: number; // Operation Income

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  operationIncomeRate: number; // Operation Income %

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  profit: number; // Profit

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  profitRate: number; // Profit %

  @OneToOne(() => Project, (project) => project.projectPPE, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => OpexItem, (opexItem) => opexItem.projectPPEIndirect, {
    cascade: true,
  })
  indirectOpex: OpexItem[];

  @OneToMany(() => OpexItem, (opexItem) => opexItem.projectPPEDirect, {
    cascade: true,
  })
  directOpex: OpexItem[];
}