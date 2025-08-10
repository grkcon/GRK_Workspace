import {
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OpexType } from '../../../entities';
import {
  IsPositiveAmount,
  IsValidMonth,
  IsValidYear,
} from '../../../common/validators/opex.validators';

export class CreateOpexItemDto {
  @IsInt()
  @IsOptional()
  id?: number; // ID가 있으면 수정, 없으면 추가

  @IsString()
  @MinLength(1, { message: 'Category cannot be empty' })
  @MaxLength(100, { message: 'Category cannot exceed 100 characters' })
  category: string;

  @IsNumber()
  @IsPositiveAmount()
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsEnum(OpexType)
  type: OpexType;
}

export class CreateMonthlyOpexDto {
  @IsInt()
  @IsValidMonth()
  month: number;

  @IsInt()
  @IsOptional()
  @Min(0, { message: 'Employee count cannot be negative' })
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
  @IsValidYear()
  year: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMonthlyOpexDto)
  months: CreateMonthlyOpexDto[];
}
