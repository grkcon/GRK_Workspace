import { PartialType } from '@nestjs/mapped-types';
import { CreatePPEDto } from './create-ppe.dto';
import { 
  IsNumber,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OpexItemDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  note?: string;
}

export class UpdatePPEDto extends PartialType(CreatePPEDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpexItemDto)
  indirectOpex?: OpexItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpexItemDto)
  directOpex?: OpexItemDto[];
}
