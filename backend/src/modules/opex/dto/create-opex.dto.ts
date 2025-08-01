import { IsString, IsNumber, IsInt, IsBoolean, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { OpexType } from '../../../entities';

export class CreateOpexItemDto {
  @IsString()
  category: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsEnum(OpexType)
  type: OpexType;
}

export class CreateMonthlyOpexDto {
  @IsInt()
  month: number;

  @IsInt()
  @IsOptional()
  employeeCount?: number;

  @IsBoolean()
  @IsOptional()
  confirmed?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpexItemDto)
  opexItems: CreateOpexItemDto[];
}

export class CreateYearlyOpexDto {
  @IsInt()
  year: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMonthlyOpexDto)
  months: CreateMonthlyOpexDto[];
}