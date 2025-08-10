import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InternalStaff } from './internal-staff.entity';
import { ExternalStaff } from './external-staff.entity';
import { ProjectClient } from './project-client.entity';
import { ProjectPayment } from './project-payment.entity';
import { ProjectPPE } from './project-ppe.entity';

export enum ProjectStatus {
  ONGOING = '진행중',
  COMPLETED = '완료',
  PLANNED = '계획',
}

@Entity('projects')
export class Project extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string; // 프로젝트명

  @Column({ type: 'varchar', length: 100 })
  client: string; // 고객사

  @Column({ type: 'date' })
  startDate: Date; // 시작일

  @Column({ type: 'date' })
  endDate: Date; // 종료일

  @Column({ type: 'varchar', length: 100 })
  pm: string; // PM

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  contractValue: number; // 계약금액

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNED,
  })
  status: ProjectStatus;

  @OneToOne(() => ProjectClient, (client) => client.project, {
    cascade: true,
  })
  projectClient: ProjectClient;

  @OneToOne(() => ProjectPayment, (payment) => payment.project, {
    cascade: true,
  })
  projectPayment: ProjectPayment;

  @OneToMany(() => InternalStaff, (staff) => staff.project, {
    cascade: true,
  })
  internalStaff: InternalStaff[];

  @OneToMany(() => ExternalStaff, (staff) => staff.project, {
    cascade: true,
  })
  externalStaff: ExternalStaff[];

  @OneToOne(() => ProjectPPE, (ppe) => ppe.project, {
    cascade: true,
  })
  projectPPE: ProjectPPE;
}
