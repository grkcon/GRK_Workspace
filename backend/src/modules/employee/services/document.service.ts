import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, Employee } from '../../../entities';
import { CreateDocumentDto, UpdateDocumentDto } from '../dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async uploadDocument(
    employeeId: number,
    file: Express.Multer.File,
    createDocumentDto: CreateDocumentDto,
  ): Promise<Document> {
    // 직원 존재 확인
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      // 업로드된 파일 삭제
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // 문서 메타데이터 생성
    const document = this.documentRepository.create({
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      fileName: file.filename,
      filePath: file.path,
      fileExtension: path.extname(file.originalname),
      fileSize: file.size,
      mimeType: file.mimetype,
      documentType: createDocumentDto.documentType,
      description: createDocumentDto.description,
      employeeId: employeeId,
    });

    return this.documentRepository.save(document);
  }

  async findByEmployee(employeeId: number): Promise<Document[]> {
    return this.documentRepository.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async updateDocument(
    id: number,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    const document = await this.findOne(id);

    Object.assign(document, updateDocumentDto);

    return this.documentRepository.save(document);
  }

  async deleteDocument(id: number): Promise<void> {
    const document = await this.findOne(id);

    // 물리적 파일 삭제
    if (fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (error) {
        console.error('Failed to delete physical file:', error);
      }
    }

    // DB에서 삭제
    await this.documentRepository.remove(document);
  }

  async getFileStream(
    id: number,
  ): Promise<{ stream: fs.ReadStream; document: Document }> {
    const document = await this.findOne(id);

    if (!fs.existsSync(document.filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    const stream = fs.createReadStream(document.filePath);
    return { stream, document };
  }

  // 허용된 파일 타입 검사
  static isAllowedFileType(mimetype: string): boolean {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    return allowedMimes.includes(mimetype);
  }

  // 파일 크기 검사 (10MB)
  static isAllowedFileSize(size: number): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return size <= maxSize;
  }
}
