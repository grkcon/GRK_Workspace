import { IsNotEmpty, IsString, IsDateString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeaveRequestType {
  MATERNITY = '출산휴가',
  CHILD_CARE = '육아휴직',
  SICK = '질병휴직',
  OTHER = '기타'
}

export enum PayType {
  PAID = 'paid',
  UNPAID = 'unpaid'
}

export class CreateLeaveRequestDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsNumber()
  @IsNotEmpty()
  employeeId: number;

  @ApiProperty({ description: 'Leave start date' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Expected return date' })
  @IsDateString()
  @IsNotEmpty()
  returnDate: string;

  @ApiProperty({ enum: LeaveRequestType, description: 'Leave reason' })
  @IsEnum(LeaveRequestType)
  @IsNotEmpty()
  reason: LeaveRequestType;

  @ApiProperty({ enum: PayType, description: 'Pay type (paid/unpaid)' })
  @IsEnum(PayType)
  @IsNotEmpty()
  payType: PayType;

  @ApiPropertyOptional({ description: 'Additional memo' })
  @IsOptional()
  @IsString()
  memo?: string;
}