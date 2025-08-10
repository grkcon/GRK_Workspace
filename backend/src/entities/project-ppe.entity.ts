import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { OpexItem } from './opex-item.entity';

@Entity('project_ppe')
export class ProjectPPE extends BaseEntity {
  @Column({ 
    type: 'decimal', 
    precision: 15, 
    scale: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  revenue: number; // 매출액

  @Column({ 
    type: 'decimal', 
    precision: 15, 
    scale: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  laborCost: number; // 투입인건비

  @Column({ 
    type: 'decimal', 
    precision: 15, 
    scale: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  outsourcingCost: number; // 외주비용

  @Column({ 
    type: 'decimal', 
    precision: 15, 
    scale: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  opexCost: number; // OPEX

  @Column({ 
    type: 'decimal', 
    precision: 15, 
    scale: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  grossIncome: number; // Gross Income

  @Column({ 
    type: 'decimal', 
    precision: 5, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  grossIncomeRate: number; // Gross Income %

  @Column({ 
    type: 'decimal', 
    precision: 15, 
    scale: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  operationIncome: number; // Operation Income

  @Column({ 
    type: 'decimal', 
    precision: 5, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  operationIncomeRate: number; // Operation Income %

  @Column({ 
    type: 'decimal', 
    precision: 15, 
    scale: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  profit: number; // Profit

  @Column({ 
    type: 'decimal', 
    precision: 5, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
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