import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMonthlyFlowDto {
  @IsInt()
  month: number;

  @IsNumber()
  @IsOptional()
  beginningCash?: number;

  @IsNumber()
  @IsOptional()
  revenue?: number;

  @IsNumber()
  @IsOptional()
  expense?: number;

  @IsNumber()
  @IsOptional()
  laborCost?: number;

  @IsNumber()
  @IsOptional()
  indirectOpex?: number;

  @IsNumber()
  @IsOptional()
  directOpex?: number;

  @IsNumber()
  @IsOptional()
  bonus?: number;

  @IsNumber()
  @IsOptional()
  researchRevenue?: number;
}

export class CreateCashFlowDto {
  @IsInt()
  year: number;

  @IsString()
  projectName: string;

  @IsString()
  @IsOptional()
  client?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMonthlyFlowDto)
  monthlyFlows: CreateMonthlyFlowDto[];
}
