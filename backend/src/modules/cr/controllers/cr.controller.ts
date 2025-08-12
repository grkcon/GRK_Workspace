import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CRService } from '../services/cr.service';
import { EmployeeCRDto, CRDetailDto } from '../dto/employee-cr.dto';

@ApiTags('CR')
@Controller('cr')
export class CRController {
  constructor(private readonly crService: CRService) {}

  @Get()
  @ApiOperation({ summary: '직원별 CR 목록 조회' })
  async getEmployeeCRList(): Promise<EmployeeCRDto[]> {
    return this.crService.getEmployeeCRList();
  }

  @Get(':employeeId/details')
  @ApiOperation({ summary: '직원 CR 상세 내역 조회' })
  @ApiParam({ name: 'employeeId', description: '직원 ID' })
  async getEmployeeCRDetails(
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ): Promise<CRDetailDto[]> {
    return this.crService.getEmployeeCRDetails(employeeId);
  }
}