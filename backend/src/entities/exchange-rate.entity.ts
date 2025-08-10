import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('exchange_rates')
@Index(['currency', 'date'], { unique: true })
export class ExchangeRate extends BaseEntity {
  @Column({ type: 'varchar', length: 3 })
  currency: string; // USD, EUR 등

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  rate: number; // KRW 대비 환율

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD 형식

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  change?: number; // 전일 대비 변동률 (%)

  @Column({ type: 'varchar', length: 100, nullable: true })
  source?: string; // 환율 데이터 출처 (예: 'exchangerate-api')
}