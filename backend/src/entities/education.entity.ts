import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

@Entity('educations')
export class Education extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  school: string; // 학교명

  @Column({ type: 'varchar', length: 100 })
  major: string; // 전공

  @Column({ type: 'varchar', length: 50 })
  degree: string; // 학위

  @Column({ type: 'date', nullable: true })
  startDate?: Date; // 입학일

  @Column({ type: 'date', nullable: true })
  graduationDate?: Date; // 졸업일

  @ManyToOne(() => Employee, (employee) => employee.education, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}