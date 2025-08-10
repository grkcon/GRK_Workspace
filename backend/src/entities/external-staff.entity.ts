import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';

@Entity('external_staff')
export class ExternalStaff extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  role: string; // 역할

  @Column({ type: 'varchar', length: 50 })
  contact: string; // 연락처

  @Column({ type: 'varchar', length: 100 })
  period: string; // 기간

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  cost: number; // 비용

  @Column({ type: 'text', nullable: true })
  memo?: string; // 메모

  @Column({ type: 'varchar', length: 255, nullable: true })
  attachment?: string; // 첨부파일

  @ManyToOne(() => Project, (project) => project.externalStaff, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
