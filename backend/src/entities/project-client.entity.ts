import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';

@Entity('project_clients')
export class ProjectClient extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string; // 고객사명

  @Column({ type: 'varchar', length: 100 })
  contactPerson: string; // 담당자

  @Column({ type: 'varchar', length: 50 })
  contactNumber: string; // 연락처

  @OneToOne(() => Project, (project) => project.projectClient, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}