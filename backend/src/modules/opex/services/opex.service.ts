import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YearlyOpex, MonthlyOpex, OpexItem, OpexType } from '../../../entities';
import { CreateYearlyOpexDto, UpdateYearlyOpexDto } from '../dto';

@Injectable()
export class OpexService {
  constructor(
    @InjectRepository(YearlyOpex)
    private yearlyOpexRepository: Repository<YearlyOpex>,
    @InjectRepository(MonthlyOpex)
    private monthlyOpexRepository: Repository<MonthlyOpex>,
    @InjectRepository(OpexItem)
    private opexItemRepository: Repository<OpexItem>,
  ) {}

  async create(createYearlyOpexDto: CreateYearlyOpexDto): Promise<YearlyOpex> {
    const yearlyOpex = this.yearlyOpexRepository.create({
      year: createYearlyOpexDto.year,
    });

    // 월별 OPEX 생성
    yearlyOpex.months = createYearlyOpexDto.months.map(monthDto => {
      const monthlyOpex = this.monthlyOpexRepository.create({
        month: monthDto.month,
        employeeCount: monthDto.employeeCount || 0,
        confirmed: monthDto.confirmed || false,
      });

      // OPEX 항목들 생성
      monthlyOpex.opexItems = monthDto.opexItems.map(itemDto =>
        this.opexItemRepository.create(itemDto)
      );

      return monthlyOpex;
    });

    return this.yearlyOpexRepository.save(yearlyOpex);
  }

  async findAll(): Promise<YearlyOpex[]> {
    return this.yearlyOpexRepository.find({
      relations: ['months', 'months.opexItems'],
      order: { year: 'DESC' },
    });
  }

  async findOne(id: number): Promise<YearlyOpex> {
    const yearlyOpex = await this.yearlyOpexRepository.findOne({
      where: { id },
      relations: ['months', 'months.opexItems'],
    });

    if (!yearlyOpex) {
      throw new NotFoundException(`Yearly OPEX with ID ${id} not found`);
    }

    return yearlyOpex;
  }

  async findByYear(year: number): Promise<YearlyOpex> {
    const yearlyOpex = await this.yearlyOpexRepository.findOne({
      where: { year },
      relations: ['months', 'months.opexItems'],
    });

    if (!yearlyOpex) {
      throw new NotFoundException(`Yearly OPEX for year ${year} not found`);
    }

    return yearlyOpex;
  }

  async update(id: number, updateYearlyOpexDto: UpdateYearlyOpexDto): Promise<YearlyOpex> {
    const yearlyOpex = await this.findOne(id);

    if (updateYearlyOpexDto.months) {
      // 기존 월별 데이터 삭제
      await this.monthlyOpexRepository.delete({ yearlyOpex: { id } });

      // 새로운 월별 데이터 생성
      yearlyOpex.months = updateYearlyOpexDto.months.map(monthDto => {
        const monthlyOpex = this.monthlyOpexRepository.create({
          month: monthDto.month,
          employeeCount: monthDto.employeeCount || 0,
          confirmed: monthDto.confirmed || false,
          yearlyOpex,
        });

        monthlyOpex.opexItems = monthDto.opexItems.map(itemDto =>
          this.opexItemRepository.create({
            ...itemDto,
            monthlyOpex,
          })
        );

        return monthlyOpex;
      });
    }

    return this.yearlyOpexRepository.save(yearlyOpex);
  }

  async remove(id: number): Promise<void> {
    const yearlyOpex = await this.findOne(id);
    await this.yearlyOpexRepository.softDelete(id);
  }

  async getMonthlyTotal(year: number, month: number): Promise<{
    indirectTotal: number;
    directTotal: number;
    totalOpex: number;
  }> {
    const yearlyOpex = await this.findByYear(year);
    const monthlyOpex = yearlyOpex.months.find(m => m.month === month);

    if (!monthlyOpex) {
      return { indirectTotal: 0, directTotal: 0, totalOpex: 0 };
    }

    const indirectTotal = monthlyOpex.opexItems
      .filter(item => item.type === OpexType.INDIRECT)
      .reduce((sum, item) => sum + item.amount, 0);

    const directTotal = monthlyOpex.opexItems
      .filter(item => item.type === OpexType.DIRECT)
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      indirectTotal,
      directTotal,
      totalOpex: indirectTotal + directTotal,
    };
  }

  async confirmMonth(year: number, month: number): Promise<MonthlyOpex> {
    const yearlyOpex = await this.findByYear(year);
    const monthlyOpex = yearlyOpex.months.find(m => m.month === month);

    if (!monthlyOpex) {
      throw new NotFoundException(`Monthly OPEX for ${year}/${month} not found`);
    }

    monthlyOpex.confirmed = true;
    return this.monthlyOpexRepository.save(monthlyOpex);
  }

  async getYearlySummary(year: number): Promise<{
    year: number;
    totalIndirectOpex: number;
    totalDirectOpex: number;
    totalOpex: number;
    monthlyBreakdown: Array<{
      month: number;
      indirectTotal: number;
      directTotal: number;
      total: number;
      confirmed: boolean;
    }>;
  }> {
    const yearlyOpex = await this.findByYear(year);

    let totalIndirectOpex = 0;
    let totalDirectOpex = 0;

    const monthlyBreakdown = yearlyOpex.months.map(monthlyOpex => {
      const indirectTotal = monthlyOpex.opexItems
        .filter(item => item.type === OpexType.INDIRECT)
        .reduce((sum, item) => sum + item.amount, 0);

      const directTotal = monthlyOpex.opexItems
        .filter(item => item.type === OpexType.DIRECT)
        .reduce((sum, item) => sum + item.amount, 0);

      totalIndirectOpex += indirectTotal;
      totalDirectOpex += directTotal;

      return {
        month: monthlyOpex.month,
        indirectTotal,
        directTotal,
        total: indirectTotal + directTotal,
        confirmed: monthlyOpex.confirmed,
      };
    });

    return {
      year,
      totalIndirectOpex,
      totalDirectOpex,
      totalOpex: totalIndirectOpex + totalDirectOpex,
      monthlyBreakdown,
    };
  }
}