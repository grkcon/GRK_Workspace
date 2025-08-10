import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

@Entity('experiences')
export class Experience extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  company: string; // 회사명

  @Column({ type: 'varchar', length: 100 })
  department: string; // 부서

  @Column({ type: 'varchar', length: 100 })
  position: string; // 직책

  @Column({ type: 'date', nullable: true })
  startDate?: Date; // 입사일

  @Column({ type: 'date', nullable: true })
  endDate?: Date; // 퇴사일

  @Column({ type: 'decimal', precision: 15, scale: 0, nullable: true })
  annualSalary?: number; // 전직장 연봉

  @ManyToOne(() => Employee, (employee) => employee.experience, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
