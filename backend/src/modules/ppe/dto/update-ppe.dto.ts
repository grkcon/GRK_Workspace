import { PartialType } from '@nestjs/mapped-types';
import { CreatePPEDto } from './create-ppe.dto';

export class UpdatePPEDto extends PartialType(CreatePPEDto) {}