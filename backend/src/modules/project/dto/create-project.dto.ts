import { IsString, IsDateString, IsNumber, IsEnum, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '../../../entities';

export class CreateProjectClientDto {
  @IsString()
  name: string;

  @IsString()
  contactPerson: string;

  @IsString()
  contactNumber: string;
}

export class CreateProjectPaymentDto {
  @IsNumber()
  @IsOptional()
  downPayment?: number;

  @IsNumber()
  @IsOptional()
  middlePayment?: number;

  @IsNumber()
  @IsOptional()
  finalPayment?: number;
}

export class CreateInternalStaffDto {
  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @IsOptional()
  utilization?: number;

  @IsNumber()
  @IsOptional()
  exclusionDays?: number;

  @IsNumber()
  totalCost: number;

  @IsNumber()
  @IsOptional()
  monthlyCost?: number;
}

export class CreateExternalStaffDto {
  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsString()
  contact: string;

  @IsString()
  period: string;

  @IsNumber()
  cost: number;

  @IsString()
  @IsOptional()
  memo?: string;

  @IsString()
  @IsOptional()
  attachment?: string;
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  client: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  pm: string;

  @IsNumber()
  contractValue: number;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ValidateNested()
  @Type(() => CreateProjectClientDto)
  @IsOptional()
  projectClient?: CreateProjectClientDto;

  @ValidateNested()
  @Type(() => CreateProjectPaymentDto)
  @IsOptional()
  projectPayment?: CreateProjectPaymentDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInternalStaffDto)
  @IsOptional()
  internalStaff?: CreateInternalStaffDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExternalStaffDto)
  @IsOptional()
  externalStaff?: CreateExternalStaffDto[];
}