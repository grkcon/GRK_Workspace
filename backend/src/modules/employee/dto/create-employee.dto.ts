import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus } from '../../../entities';

export class CreateEducationDto {
  @IsString()
  school: string;

  @IsString()
  major: string;

  @IsString()
  degree: string;
}

export class CreateExperienceDto {
  @IsString()
  company: string;

  @IsString()
  department: string;

  @IsString()
  position: string;
}

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsString()
  empNo: string;

  @IsString()
  position: string;

  @IsString()
  rank: string;

  @IsString()
  department: string;

  @IsString()
  tel: string;

  @IsEmail()
  email: string;

  @IsOptional()
  age?: number;

  @IsDateString()
  joinDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  monthlySalary?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  ssn?: string;

  @IsString()
  @IsOptional()
  bankAccount?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEducationDto)
  @IsOptional()
  education?: CreateEducationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceDto)
  @IsOptional()
  experience?: CreateExperienceDto[];
}