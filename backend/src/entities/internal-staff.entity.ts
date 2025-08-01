import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { Employee } from './employee.entity';

@Entity('internal_staff')
export class InternalStaff extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  role: string; // 역할

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  utilization: number; // 투입율 %

  @Column({ type: 'int', default: 0 })
  exclusionDays: number; // 투입제외일

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  totalCost: number; // 총 투입원가

  @Column({ type: 'decimal', precision: 15, scale: 0, nullable: true })
  monthlyCost?: number; // 월 원가

  @ManyToOne(() => Project, (project) => project.internalStaff, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Employee, (employee) => employee.projectAssignments)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}