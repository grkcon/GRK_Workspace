import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { OpexService } from '../services/opex.service';
import { CreateYearlyOpexDto, UpdateYearlyOpexDto, UpdateMonthDataDto, CreateOpexItemDto } from '../dto';

@Controller('opex')
export class OpexController {
  constructor(private readonly opexService: OpexService) {}

  @Post()
  create(@Body() createYearlyOpexDto: CreateYearlyOpexDto) {
    return this.opexService.create(createYearlyOpexDto);
  }

  @Get()
  findAll() {
    return this.opexService.findAll();
  }

  @Get('year/:year')
  findByYear(@Param('year', ParseIntPipe) year: number) {
    return this.opexService.findByYear(year);
  }

  @Get('year/:year/summary')
  getYearlySummary(@Param('year', ParseIntPipe) year: number) {
    return this.opexService.getYearlySummary(year);
  }

  @Get('year/:year/month/:month/total')
  getMonthlyTotal(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.opexService.getMonthlyTotal(year, month);
  }

  @Patch('year/:year/month/:month')
  updateMonthData(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Body() data: any,
  ) {
    return this.opexService.updateMonthData(year, month, data);
  }

  // ID 기반 CRUD를 지원하는 새로운 엔드포인트
  @Put('year/:year/month/:month')
  updateMonthDataV2(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Body() dto: UpdateMonthDataDto,
  ) {
    return this.opexService.updateMonthDataV2(year, month, dto);
  }

  @Patch('year/:year/month/:month/confirm')
  confirmMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.opexService.confirmMonth(year, month);
  }

  @Get('available-years')
  getAvailableYears() {
    return this.opexService.getAvailableYears();
  }

  // OpexItem 개별 관리 엔드포인트
  @Get('items/:id')
  getOpexItem(@Param('id', ParseIntPipe) id: number) {
    return this.opexService.getOpexItem(id);
  }

  @Patch('items/:id')
  updateOpexItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<CreateOpexItemDto>,
  ) {
    return this.opexService.updateOpexItem(id, data);
  }

  @Delete('items/:id')
  deleteOpexItem(@Param('id', ParseIntPipe) id: number) {
    return this.opexService.deleteOpexItem(id);
  }

  // 일반적인 ID 기반 라우트들은 맨 마지막에 배치
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.opexService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateYearlyOpexDto: UpdateYearlyOpexDto,
  ) {
    return this.opexService.update(id, updateYearlyOpexDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.opexService.remove(id);
  }
}