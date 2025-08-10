import { PartialType } from '@nestjs/mapped-types';
import { CreateCashFlowDto } from './create-cashflow.dto';

export class UpdateCashFlowDto extends PartialType(CreateCashFlowDto) {}
