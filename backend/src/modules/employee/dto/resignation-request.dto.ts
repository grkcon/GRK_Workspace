import { IsNotEmpty, IsString, IsDateString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SeverancePayType {
  YES = 'yes',
  NO = 'no'
}

export class CreateResignationRequestDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsNumber()
  @IsNotEmpty()
  employeeId: number;

  @ApiProperty({ description: 'Resignation date' })
  @IsDateString()
  @IsNotEmpty()
  resignDate: string;

  @ApiProperty({ description: 'Resignation reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Accrued leave days', minimum: 0 })
  @IsNumber()
  @Min(0)
  leaveAccrued: number;

  @ApiProperty({ description: 'Used leave days', minimum: 0 })
  @IsNumber()
  @Min(0)
  leaveUsed: number;

  @ApiProperty({ description: 'Remaining leave days', minimum: 0 })
  @IsNumber()
  @Min(0)
  leaveRemaining: number;

  @ApiProperty({ description: 'Leave allowance amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  leaveAllowance: number;

  @ApiProperty({ enum: SeverancePayType, description: 'Severance pay eligibility' })
  @IsEnum(SeverancePayType)
  severancePay: SeverancePayType;

  @ApiPropertyOptional({ description: 'Additional memo' })
  @IsOptional()
  @IsString()
  memo?: string;
}