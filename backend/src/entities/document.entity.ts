import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

export enum DocumentType {
  RESUME = 'RESUME',           // 이력서
  DIPLOMA = 'DIPLOMA',         // 졸업증명서
  CAREER_CERT = 'CAREER_CERT', // 경력증명서
  LICENSE = 'LICENSE',         // 자격증
  OTHER = 'OTHER'              // 기타
}

@Entity('documents')
export class Document extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  originalName: string; // 원본 파일명

  @Column({ type: 'varchar', length: 200 })
  fileName: string; // 저장된 파일명 (고유)

  @Column({ type: 'varchar', length: 300 })
  filePath: string; // 파일 저장 경로

  @Column({ type: 'varchar', length: 10 })
  fileExtension: string; // 파일 확장자

  @Column({ type: 'int' })
  fileSize: number; // 파일 크기 (bytes)

  @Column({ type: 'varchar', length: 100 })
  mimeType: string; // MIME 타입

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  documentType: DocumentType; // 문서 분류

  @Column({ type: 'text', nullable: true })
  description?: string; // 문서 설명

  @ManyToOne(() => Employee, (employee) => employee.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ name: 'employeeId' })
  employeeId: number;
}