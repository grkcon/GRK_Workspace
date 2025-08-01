import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';

@Entity('project_payments')
export class ProjectPayment extends BaseEntity {
  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  downPayment: number; // 계약금

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  middlePayment: number; // 중도금

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  finalPayment: number; // 잔금

  @OneToOne(() => Project, (project) => project.projectPayment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}