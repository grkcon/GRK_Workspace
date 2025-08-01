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
} from '@nestjs/common';
import { HRCostService } from '../services/hr-cost.service';
import { CreateHRCostDto, UpdateHRCostDto } from '../dto';

@Controller('hr-costs')
export class HRCostController {
  constructor(private readonly hrCostService: HRCostService) {}

  @Post()
  create(@Body() createHRCostDto: CreateHRCostDto) {
    return this.hrCostService.create(createHRCostDto);
  }

  @Get()
  findAll(@Query('year', ParseIntPipe) year?: number) {
    if (year) {
      return this.hrCostService.findByYear(year);
    }
    return this.hrCostService.findAll();
  }

  @Get('totals/:year')
  getTotalLaborCost(@Param('year', ParseIntPipe) year: number) {
    return this.hrCostService.calculateTotalLaborCost(year);
  }

  @Get('monthly-total/:year/:month')
  getMonthlyTotal(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.hrCostService.getMonthlyTotal(year, month);
  }

  @Get('employee/:employeeId/year/:year')
  findByEmployeeAndYear(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.hrCostService.findByEmployeeAndYear(employeeId, year);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hrCostService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHRCostDto: UpdateHRCostDto,
  ) {
    return this.hrCostService.update(id, updateHRCostDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hrCostService.remove(id);
  }
}