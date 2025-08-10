import { PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '../../../entities';
import { CreateLeaveRequestDto } from './create-leave-request.dto';

export class UpdateLeaveRequestDto extends PartialType(CreateLeaveRequestDto) {
  @ApiPropertyOptional({ description: 'Request status', enum: RequestStatus })
  @IsEnum(RequestStatus)
  @IsOptional()
  status?: RequestStatus;

  @ApiPropertyOptional({ description: 'Approver name' })
  @IsString()
  @IsOptional()
  approver?: string;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  @IsString()
  @IsOptional()
  rejectReason?: string;
}