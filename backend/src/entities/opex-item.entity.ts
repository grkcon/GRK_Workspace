import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MonthlyOpex } from './monthly-opex.entity';
import { ProjectPPE } from './project-ppe.entity';

export enum OpexType {
  INDIRECT = 'indirect',
  DIRECT = 'direct',
}

@Entity('opex_items')
export class OpexItem extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  category: string; // 항목

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  amount: number; // 금액

  @Column({ type: 'text', nullable: true })
  note?: string; // 비고

  @Column({
    type: 'enum',
    enum: OpexType,
  })
  type: OpexType;

  @ManyToOne(() => MonthlyOpex, (monthlyOpex) => monthlyOpex.opexItems, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'monthly_opex_id' })
  monthlyOpex?: MonthlyOpex;

  @ManyToOne(() => ProjectPPE, (projectPPE) => projectPPE.indirectOpex, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_ppe_indirect_id' })
  projectPPEIndirect?: ProjectPPE;

  @ManyToOne(() => ProjectPPE, (projectPPE) => projectPPE.directOpex, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_ppe_direct_id' })
  projectPPEDirect?: ProjectPPE;
}