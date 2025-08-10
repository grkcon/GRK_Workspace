import { IsString, IsEnum, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../../entities';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.RESUME,
  })
  @IsEnum(DocumentType, { message: '올바른 문서 타입이 아닙니다.' })
  documentType: DocumentType;

  @ApiPropertyOptional({
    description: 'Document description',
    maxLength: 500,
    example: '2024년 최신 이력서',
  })
  @IsString({ message: '문서 설명은 문자열이어야 합니다.' })
  @IsOptional()
  @Length(0, 500, { message: '문서 설명은 500자 이하여야 합니다.' })
  description?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: 'Document type',
    enum: DocumentType,
  })
  @IsEnum(DocumentType, { message: '올바른 문서 타입이 아닙니다.' })
  @IsOptional()
  documentType?: DocumentType;

  @ApiPropertyOptional({
    description: 'Document description',
    maxLength: 500,
  })
  @IsString({ message: '문서 설명은 문자열이어야 합니다.' })
  @IsOptional()
  @Length(0, 500, { message: '문서 설명은 500자 이하여야 합니다.' })
  description?: string;
}
