import { IsNumber, IsInt } from 'class-validator';

export class CreateHRCostDto {
  @IsNumber()
  annualSalary: number;

  @IsNumber()
  socialInsurance: number;

  @IsNumber()
  retirementPension: number;

  @IsNumber()
  companyBurden: number;

  @IsNumber()
  monthlyCost: number;

  @IsNumber()
  bonus: number;

  @IsNumber()
  fixedLaborCost: number;

  @IsInt()
  year: number;

  @IsInt()
  employeeId: number;
}
