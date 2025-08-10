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
import { CashFlowService } from '../services/cashflow.service';
import { CreateCashFlowDto, UpdateCashFlowDto } from '../dto';

@Controller('cashflow')
export class CashFlowController {
  constructor(private readonly cashFlowService: CashFlowService) {}

  @Post()
  create(@Body() createCashFlowDto: CreateCashFlowDto) {
    return this.cashFlowService.create(createCashFlowDto);
  }

  @Get()
  findAll(@Query('year', ParseIntPipe) year?: number) {
    if (year) {
      return this.cashFlowService.findByYear(year);
    }
    return this.cashFlowService.findAll();
  }

  @Get('calculate/:year/:month')
  calculateMonthlyCashFlow(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.cashFlowService.calculateMonthlyCashFlow(year, month);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cashFlowService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCashFlowDto: UpdateCashFlowDto,
  ) {
    return this.cashFlowService.update(id, updateCashFlowDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cashFlowService.remove(id);
  }
}
