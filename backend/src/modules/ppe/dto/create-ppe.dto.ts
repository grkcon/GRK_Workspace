import {
  IsNumber,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OpexItemDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  note?: string;
}

export class CreatePPEDto {
  @IsNumber()
  @Min(0)
  revenue: number; // 매출액

  @IsNumber()
  @Min(0)
  laborCost: number; // 투입인건비

  @IsNumber()
  @Min(0)
  outsourcingCost: number; // 외주비용

  @IsNumber()
  @Min(0)
  opexCost: number; // OPEX

  @IsOptional()
  @IsNumber()
  grossIncome?: number; // Gross Income (자동 계산)

  @IsOptional()
  @IsNumber()
  grossIncomeRate?: number; // Gross Income % (자동 계산)

  @IsOptional()
  @IsNumber()
  operationIncome?: number; // Operation Income (자동 계산)

  @IsOptional()
  @IsNumber()
  operationIncomeRate?: number; // Operation Income % (자동 계산)

  @IsOptional()
  @IsNumber()
  profit?: number; // Profit (자동 계산)

  @IsOptional()
  @IsNumber()
  profitRate?: number; // Profit % (자동 계산)

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpexItemDto)
  indirectOpex?: OpexItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpexItemDto)
  directOpex?: OpexItemDto[];
}
