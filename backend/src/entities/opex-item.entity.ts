import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MonthlyOpex } from './monthly-opex.entity';
import { ProjectPPE } from './project-ppe.entity';

export enum OpexType {
  INDIRECT = 'indirect',
  DIRECT = 'direct',
}

export enum OpexRelationshipType {
  MONTHLY_OPEX = 'monthly_opex',
  PPE_INDIRECT = 'ppe_indirect', 
  PPE_DIRECT = 'ppe_direct',
}

@Entity('opex_items')
export class OpexItem extends BaseEntity {

  @Column({ type: 'varchar', length: 100 })
  category: string; // 항목

  @Column({ 
    type: 'decimal', 
    precision: 15, 
    scale: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  amount: number; // 금액

  @Column({ type: 'text', nullable: true })
  note?: string; // 비고

  @Column({
    type: 'enum',
    enum: OpexType,
  })
  type: OpexType;

  @Column({
    type: 'enum',
    enum: OpexRelationshipType,
    default: OpexRelationshipType.MONTHLY_OPEX,
  })
  relationshipType: OpexRelationshipType;

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