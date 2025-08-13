import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { EmployeeService } from '../services/employee.service';
import { DocumentService } from '../services/document.service';
import { EmployeeHRCostService } from '../services/hr-cost.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  UpdateDocumentDto,
  CreateEmployeeHRCostDto,
  UpdateEmployeeHRCostDto,
  CreateLeaveRequestDto,
  CreateResignationRequestDto,
  CreateEvaluationDto,
} from '../dto';
import { Response } from 'express';

@ApiTags('employees')
@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly documentService: DocumentService,
    private readonly hrCostService: EmployeeHRCostService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: 'Employee created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto) {
    try {
      const result = await this.employeeService.create(createEmployeeDto);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  @ApiQuery({
    name: 'department',
    required: false,
    description: 'Filter by department',
  })
  @ApiResponse({ status: 200, description: 'Return all employees.' })
  findAll(@Query('department') department?: string) {
    if (department) {
      return this.employeeService.getEmployeesByDepartment(department);
    }
    return this.employeeService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active employees' })
  @ApiResponse({ status: 200, description: 'Return all active employees.' })
  getActiveEmployees() {
    return this.employeeService.getActiveEmployees();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Return the employee.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.findOne(id);
  }

  @Get('empno/:empNo')
  @ApiOperation({ summary: 'Get employee by employee number' })
  @ApiParam({ name: 'empNo', description: 'Employee number' })
  @ApiResponse({ status: 200, description: 'Return the employee.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  findByEmpNo(@Param('empNo') empNo: string) {
    return this.employeeService.findByEmpNo(empNo);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    try {
      const result = await this.employeeService.update(id, updateEmployeeDto);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.employeeService.remove(id);
    return { message: 'Employee deleted successfully', id };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore deleted employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee restored successfully.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.restore(id);
  }

  @Get('deleted/list')
  @ApiOperation({ summary: 'Get all deleted employees' })
  @ApiResponse({ status: 200, description: 'Return all deleted employees.' })
  findDeleted() {
    return this.employeeService.findDeleted();
  }

  @Post(':id/profile-image')
  @ApiOperation({ summary: 'Upload employee profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile image uploaded successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or employee not found.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'profile-images');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const id = req.params.id;
          const fileExtName = extname(file.originalname);
          const fileName = `employee-${id}-${Date.now()}${fileExtName}`;
          cb(null, fileName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadProfileImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const imageUrl = `/uploads/profile-images/${file.filename}`;
    return this.employeeService.updateProfileImage(id, imageUrl);
  }

  // 문서 업로드
  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload employee document' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or employee not found.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'documents');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const employeeId = req.params.id;
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const fileExtName = extname(file.originalname);
          const fileName = `emp-${employeeId}-${timestamp}-${randomString}${fileExtName}`;
          cb(null, fileName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!DocumentService.isAllowedFileType(file.mimetype)) {
          return cb(
            new BadRequestException(
              'File type not allowed. Only PDF, DOC, DOCX, JPG, PNG are allowed.',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadDocument(
    @Param('id', ParseIntPipe) employeeId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Body('description') description?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!DocumentService.isAllowedFileSize(file.size)) {
      throw new BadRequestException(
        'File size too large. Maximum size is 10MB.',
      );
    }

    return this.documentService.uploadDocument(employeeId, file, {
      documentType: documentType as any,
      description,
    });
  }

  // 직원 문서 목록 조회
  @Get(':id/documents')
  @ApiOperation({ summary: 'Get employee documents' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Return employee documents.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  getEmployeeDocuments(@Param('id', ParseIntPipe) employeeId: number) {
    return this.documentService.findByEmployee(employeeId);
  }

  // 문서 다운로드
  @Get('documents/:documentId/download')
  @ApiOperation({ summary: 'Download document' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document downloaded successfully.',
  })
  @ApiResponse({ status: 404, description: 'Document not found.' })
  async downloadDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, document } =
      await this.documentService.getFileStream(documentId);

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(document.originalName)}"`,
    });

    return new StreamableFile(stream);
  }

  // 문서 정보 수정
  @Patch('documents/:documentId')
  @ApiOperation({ summary: 'Update document information' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document updated successfully.' })
  @ApiResponse({ status: 404, description: 'Document not found.' })
  updateDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentService.updateDocument(documentId, updateDocumentDto);
  }

  // 문서 삭제
  @Delete('documents/:documentId')
  @ApiOperation({ summary: 'Delete document' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Document not found.' })
  async deleteDocument(@Param('documentId', ParseIntPipe) documentId: number) {
    await this.documentService.deleteDocument(documentId);
    return { message: 'Document deleted successfully', id: documentId };
  }

  // 해당 월 기준 재직 직원수 조회
  @Get('active-count/:year/:month')
  @ApiOperation({
    summary: 'Get active employee count for specific month',
    description:
      '특정 연도/월 기준으로 실제 재직 중인 직원수를 반환합니다. 퇴사일, 휴직 기간을 고려하여 계산됩니다.',
  })
  @ApiParam({ name: 'year', description: '연도 (예: 2025)' })
  @ApiParam({ name: 'month', description: '월 (1-12)' })
  @ApiResponse({
    status: 200,
    description: '해당 월 재직 직원수',
    schema: {
      type: 'object',
      properties: {
        year: { type: 'number', example: 2025 },
        month: { type: 'number', example: 3 },
        activeEmployeeCount: { type: 'number', example: 15 },
      },
    },
  })
  async getActiveEmployeeCountByMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    // 월이 1-12 범위에 있는지 확인
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    const activeEmployeeCount =
      await this.employeeService.getActiveEmployeeCountByMonth(year, month);

    return {
      year,
      month,
      activeEmployeeCount,
    };
  }

  // ======== HR Cost 관련 엔드포인트 ========

  @Get(':id/hr-cost/:year')
  @ApiOperation({ summary: 'Get employee HR cost for specific year' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiParam({ name: 'year', description: '연도 (예: 2025)' })
  @ApiResponse({ status: 200, description: 'Employee HR cost data' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeHRCost(
    @Param('id', ParseIntPipe) employeeId: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return await this.hrCostService.findByEmployeeAndYear(employeeId, year);
  }

  @Get(':id/hr-cost/:year/:month')
  @ApiOperation({ summary: 'Get employee HR cost for specific year and month' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiParam({ name: 'year', description: '연도 (예: 2025)' })
  @ApiParam({ name: 'month', description: '월 (1-12)' })
  @ApiResponse({
    status: 200,
    description: 'Employee HR cost data for the month',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeHRCostByMonth(
    @Param('id', ParseIntPipe) employeeId: number,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return await this.hrCostService.findByEmployeeYearMonth(
      employeeId,
      year,
      month,
    );
  }

  @Post(':id/hr-cost')
  @ApiOperation({ summary: 'Create employee HR cost data' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({
    status: 201,
    description: 'HR cost data created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'HR cost data already exists' })
  async createEmployeeHRCost(
    @Param('id', ParseIntPipe) employeeId: number,
    @Body() createDto: CreateEmployeeHRCostDto,
  ) {
    // DTO에 employeeId 설정
    createDto.employeeId = employeeId;
    return await this.hrCostService.create(createDto);
  }

  @Patch(':id/hr-cost/:year')
  @ApiOperation({ summary: 'Update employee HR cost data' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiParam({ name: 'year', description: '연도 (예: 2025)' })
  @ApiResponse({
    status: 200,
    description: 'HR cost data updated successfully',
  })
  @ApiResponse({ status: 404, description: 'HR cost data not found' })
  async updateEmployeeHRCost(
    @Param('id', ParseIntPipe) employeeId: number,
    @Param('year', ParseIntPipe) year: number,
    @Body() updateDto: UpdateEmployeeHRCostDto,
  ) {
    return await this.hrCostService.update(employeeId, year, updateDto);
  }

  @Get('hr-cost-all/:year/:month')
  @ApiOperation({
    summary: 'Get HR cost for all employees for specific year and month',
    description: '모든 직원의 특정 연도/월 HR Cost를 조회합니다.',
  })
  @ApiParam({ name: 'year', description: '연도 (예: 2025)' })
  @ApiParam({ name: 'month', description: '월 (1-12)' })
  @ApiResponse({
    status: 200,
    description: '모든 직원의 HR Cost 데이터',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          employee: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              position: { type: 'string' },
              department: { type: 'string' },
              monthlySalary: { type: 'string' },
            },
          },
          hrCost: { type: 'object' },
        },
      },
    },
  })
  async getAllEmployeesHRCost(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    // 월이 1-12 범위에 있는지 확인
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    return await this.hrCostService.findAllEmployeesHRCost(year, month);
  }

  @Get(':id/hr-cost')
  @ApiOperation({ summary: 'Get all HR cost history for employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee HR cost history' })
  async getEmployeeHRCostHistory(
    @Param('id', ParseIntPipe) employeeId: number,
  ) {
    return await this.hrCostService.findAllByEmployee(employeeId);
  }

  // ======== 휴직/퇴사 관련 엔드포인트 ========

  @Post(':id/leave-request')
  @ApiOperation({ summary: 'Process employee leave request' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Leave request processed successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async processLeaveRequest(
    @Param('id', ParseIntPipe) employeeId: number,
    @Body() leaveRequestDto: CreateLeaveRequestDto,
  ) {
    // DTO에 employeeId 설정
    leaveRequestDto.employeeId = employeeId;
    return await this.employeeService.processLeaveRequest(leaveRequestDto);
  }

  @Post(':id/resignation-request')
  @ApiOperation({ summary: 'Process employee resignation request' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Resignation request processed successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async processResignationRequest(
    @Param('id', ParseIntPipe) employeeId: number,
    @Body() resignationRequestDto: CreateResignationRequestDto,
  ) {
    // DTO에 employeeId 설정
    resignationRequestDto.employeeId = employeeId;
    return await this.employeeService.processResignationRequest(resignationRequestDto);
  }

  @Post(':id/return-from-leave')
  @ApiOperation({ summary: 'Process employee return from leave' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Return from leave processed successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 400, description: 'Employee is not on leave' })
  async processReturnFromLeave(@Param('id', ParseIntPipe) employeeId: number) {
    return await this.employeeService.processReturnFromLeave(employeeId);
  }

  // ======== 평가 관련 엔드포인트 ========

  @Post(':id/evaluation')
  @ApiOperation({ summary: 'Save employee evaluation' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 201, description: 'Evaluation saved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 400, description: 'Invalid evaluation data' })
  async saveEvaluation(
    @Param('id', ParseIntPipe) employeeId: number,
    @Body() evaluationDto: CreateEvaluationDto,
  ) {
    return await this.employeeService.saveEvaluation(employeeId, evaluationDto);
  }

  @Get(':id/evaluation')
  @ApiOperation({ summary: 'Get employee evaluation' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee evaluation data' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEvaluation(@Param('id', ParseIntPipe) employeeId: number) {
    return await this.employeeService.getEvaluation(employeeId);
  }
}
