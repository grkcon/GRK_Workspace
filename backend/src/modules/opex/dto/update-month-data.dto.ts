import { IsInt, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOpexItemDto } from './create-opex.dto';

export class UpdateMonthDataDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  employeeCount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpexItemDto)
  @IsOptional()
  indirect?: CreateOpexItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpexItemDto)
  @IsOptional()
  direct?: CreateOpexItemDto[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  deleteIds?: number[]; // 삭제할 OpexItem ID 목록
}