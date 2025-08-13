import { IsNumber, IsOptional, IsString, IsObject, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEvaluationDto {
  @IsNumber({}, { message: 'Industry insight score must be a number' })
  @Min(0, { message: 'Score must be at least 0' })
  @Max(5, { message: 'Score must be at most 5' })
  industryInsight: number;

  @IsNumber({}, { message: 'Consulting skill score must be a number' })
  @Min(0, { message: 'Score must be at least 0' })
  @Max(5, { message: 'Score must be at most 5' })
  consultingSkill: number;

  @IsNumber({}, { message: 'Job attitude score must be a number' })
  @Min(0, { message: 'Score must be at least 0' })
  @Max(5, { message: 'Score must be at most 5' })
  jobAttitude: number;

  @IsNumber({}, { message: 'Client relationship score must be a number' })
  @Min(0, { message: 'Score must be at least 0' })
  @Max(5, { message: 'Score must be at most 5' })
  clientRelationship: number;

  @IsNumber({}, { message: 'People management skill score must be a number' })
  @Min(0, { message: 'Score must be at least 0' })
  @Max(5, { message: 'Score must be at most 5' })
  peopleManagementSkill: number;

  @IsNumber({}, { message: 'Company fit & commitment score must be a number' })
  @Min(0, { message: 'Score must be at least 0' })
  @Max(5, { message: 'Score must be at most 5' })
  companyFitCommitment: number;

  @IsOptional()
  @IsNumber({}, { message: 'CEO evaluation score must be a number' })
  @Min(0, { message: 'CEO evaluation score must be at least 0' })
  @Max(5, { message: 'CEO evaluation score must be at most 5' })
  ceoEval?: number;

  @IsOptional()
  @IsString()
  evaluatedBy?: string;

  @IsOptional()
  @IsObject()
  feedback?: {
    [category: string]: string;
  };
}