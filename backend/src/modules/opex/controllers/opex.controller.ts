import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { OpexService } from '../services/opex.service';
import { CreateYearlyOpexDto, UpdateYearlyOpexDto } from '../dto';

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

  @Patch('year/:year/month/:month/confirm')
  confirmMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.opexService.confirmMonth(year, month);
  }

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