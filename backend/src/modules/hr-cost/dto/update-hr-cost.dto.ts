import { PartialType } from '@nestjs/mapped-types';
import { CreateHRCostDto } from './create-hr-cost.dto';

export class UpdateHRCostDto extends PartialType(CreateHRCostDto) {}