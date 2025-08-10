import { IsString, IsDateString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '../../../entities';

export class CreateLeaveRequestDto {
  @ApiProperty({ description: 'Leave type', enum: LeaveType })
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Number of days' })
  @IsNumber()
  days: number;

  @ApiProperty({ description: 'Reason for leave' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Employee ID' })
  @IsNumber()
  employeeId: number;

  @ApiPropertyOptional({ description: 'Request date' })
  @IsDateString()
  @IsOptional()
  requestDate?: string;
}