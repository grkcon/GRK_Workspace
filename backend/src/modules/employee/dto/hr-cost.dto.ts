import { IsNumber, IsOptional, IsString, IsDateString, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeHRCostDto {
  @IsNumber()
  @IsPositive()
  employeeId: number;

  @IsNumber()
  @Min(2020)
  @Max(2050)
  year: number;

  @IsNumber()
  @IsPositive()
  annualSalary: number; // 연봉

  @IsDateString()
  bonusBaseDate: string; // 상여금 기준일

  @IsDateString()
  performanceBaseDate: string; // 성과급 기준일

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  bonusRate?: number; // 상여금 비율 (기본 0.05)

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  performanceRate?: number; // 성과급 비율 (기본 1.0)

  @IsOptional()
  @IsNumber()
  @IsPositive()
  welfareCost?: number; // 복지비용 (기본 1,700,000)

  @IsOptional()
  @IsString()
  memo?: string;
}

export class UpdateEmployeeHRCostDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  annualSalary?: number; // 연봉 (편집 가능)

  @IsOptional()
  @IsDateString()
  bonusBaseDate?: string; // 상여금 기준일 (연도만 변경)

  @IsOptional()
  @IsDateString()
  performanceBaseDate?: string; // 성과급 기준일 (연도만 변경)

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  bonusRate?: number; // 상여금 비율

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  performanceRate?: number; // 성과급 비율

  @IsOptional()
  @IsNumber()
  @IsPositive()
  welfareCost?: number; // 복지비용

  @IsOptional()
  @IsString()
  memo?: string;
}

export class EmployeeHRCostResponseDto {
  id: number;
  year: number;

  // 기본 정보
  annualSalary: number;
  joinDate: Date; // Employee에서 가져옴
  bonusBaseDate: Date;
  performanceBaseDate: Date;

  // 계산된 급여 정보
  insuranceRetirement: number; // 4대보험/퇴직금
  companyBurden: number; // 회사 부담금액
  monthlyBurden: number; // 월 부담액

  // 상여금 정보
  bonusBaseDays: number; // 상여 기준일수
  bonusRate: number; // 상여금 비율
  performanceBaseDays: number; // PS 기준일수
  performanceRate: number; // PS 비율
  bonusAmount: number; // 상여금

  // 기타 비용
  welfareCost: number; // 복지비용
  fixedLaborCost: number; // 고정 인건비
  monthlyLaborCost: number; // 월 인력비

  // 배분 정보
  opexAllocation: number; // OPEX 배분
  eps: number; // EPS
  monthlyEps: number; // Monthly EPS
  ecm: number; // ECM
  finalLaborCost: number; // 최종 인력원가

  // 역할별 조정 비율
  roleMultiplier: number; // 역할별 조정 비율 (파트너 3.5, 관리자 0.5 등)
  adjustedMonthlyLaborCost: number; // 조정된 월 인력비
  adjustedFinalLaborCost: number; // 조정된 최종 인력원가

  // 메모
  memo?: string;

  // 계산 공식 설명
  calculationFormulas: {
    companyBurden: string;
    fixedLaborCost: string;
    monthlyLaborCost: string;
    insuranceRetirement: string;
  };

  createdAt: Date;
  updatedAt: Date;
}