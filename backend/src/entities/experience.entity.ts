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

  @ManyToOne(() => Employee, (employee) => employee.experience, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}