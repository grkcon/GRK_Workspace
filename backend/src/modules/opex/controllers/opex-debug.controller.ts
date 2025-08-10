import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { OpexService } from '../services/opex.service';
import { DebugModeGuard } from '../../../common/guards/debug-mode.guard';

/**
 * 디버그 전용 컨트롤러
 * 개발 환경에서만 활성화됨
 */
@Controller('opex/debug')
@UseGuards(DebugModeGuard)
export class OpexDebugController {
  constructor(private readonly opexService: OpexService) {}

  @Get('items/:year')
  async getOpexItemsForDebug(@Param('year', ParseIntPipe) year: number) {
    return this.opexService.getOpexItemsForDebug(year);
  }

  @Get('future-months/:year/:month')
  async getFutureMonthsForDebug(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.opexService.getFutureMonthsForDebug(year, month);
  }

  @Patch('reset-confirmed/:year/:month')
  async resetConfirmedStatus(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.opexService.resetConfirmedStatus(year, month);
  }

  @Get('raw-count/:year')
  async getRawItemCount(@Param('year', ParseIntPipe) year: number) {
    return this.opexService.getRawItemCount(year);
  }

  @Post('create-test-data/:year/:month')
  async createTestData(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.opexService.createTestMonthData(year, month);
  }

  @Post('test-simple-save/:year/:month')
  async testSimpleSave(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.opexService.testSimpleSave(year, month);
  }

  @Delete('test-direct-delete/:year/:month')
  async testDirectDelete(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.opexService.testDirectDelete(year, month);
  }

  @Delete('clear-all-data/:year')
  async clearAllData(@Param('year', ParseIntPipe) year: number) {
    return this.opexService.clearAllOpexData(year);
  }
}
