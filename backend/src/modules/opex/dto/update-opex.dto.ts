import { PartialType } from '@nestjs/mapped-types';
import { CreateYearlyOpexDto } from './create-opex.dto';

export class UpdateYearlyOpexDto extends PartialType(CreateYearlyOpexDto) {}