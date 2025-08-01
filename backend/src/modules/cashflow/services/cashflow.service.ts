import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashFlow, MonthlyFlow } from '../../../entities';
import { CreateCashFlowDto, UpdateCashFlowDto } from '../dto';
import { CashFlowCalculator } from '../calculators/cashflow.calculator';

@Injectable()
export class CashFlowService {
  constructor(
    @InjectRepository(CashFlow)
    private cashFlowRepository: Repository<CashFlow>,
    @InjectRepository(MonthlyFlow)
    private monthlyFlowRepository: Repository<MonthlyFlow>,
    private cashFlowCalculator: CashFlowCalculator,
  ) {}

  async create(createCashFlowDto: CreateCashFlowDto): Promise<CashFlow> {
    const cashFlow = this.cashFlowRepository.create({
      year: createCashFlowDto.year,
      projectName: createCashFlowDto.projectName,
      client: createCashFlowDto.client,
    });

    // 먼저 cashFlow 저장
    const savedCashFlow = await this.cashFlowRepository.save(cashFlow);

    // 월별 현금흐름 생성
    const monthlyFlows: MonthlyFlow[] = [];
    let previousEndingCash = 0;

    for (const flowDto of createCashFlowDto.monthlyFlows) {
      const monthlyFlow = this.monthlyFlowRepository.create({
        ...flowDto,
        cashFlow: savedCashFlow,
        beginningCash: flowDto.month === 1 ? flowDto.beginningCash || 0 : previousEndingCash,
      });

      // 지출 계산
      monthlyFlow.expense = this.cashFlowCalculator.calculateMonthlyExpense(
        monthlyFlow.laborCost || 0,
        monthlyFlow.indirectOpex || 0,
        monthlyFlow.directOpex || 0,
        monthlyFlow.bonus || 0
      );

      // 기말현금 계산
      monthlyFlow.endingCash = this.cashFlowCalculator.calculateEndingCash(
        monthlyFlow.beginningCash,
        (monthlyFlow.revenue || 0) + (monthlyFlow.researchRevenue || 0),
        monthlyFlow.expense
      );

      previousEndingCash = monthlyFlow.endingCash;
      monthlyFlows.push(monthlyFlow);
    }

    // 월별 데이터 저장
    savedCashFlow.monthlyFlows = await this.monthlyFlowRepository.save(monthlyFlows);

    // 총합 계산
    savedCashFlow.totalRevenue = monthlyFlows.reduce((sum, flow) => 
      sum + flow.revenue + flow.researchRevenue, 0
    );
    savedCashFlow.totalExpense = monthlyFlows.reduce((sum, flow) => 
      sum + flow.expense, 0
    );
    savedCashFlow.netCashFlow = savedCashFlow.totalRevenue - savedCashFlow.totalExpense;

    return this.cashFlowRepository.save(savedCashFlow);
  }

  async findAll(): Promise<CashFlow[]> {
    return this.cashFlowRepository.find({
      relations: ['monthlyFlows'],
      order: { year: 'DESC' },
    });
  }

  async findOne(id: number): Promise<CashFlow> {
    const cashFlow = await this.cashFlowRepository.findOne({
      where: { id },
      relations: ['monthlyFlows'],
    });

    if (!cashFlow) {
      throw new NotFoundException(`CashFlow with ID ${id} not found`);
    }

    return cashFlow;
  }

  async findByYear(year: number): Promise<CashFlow[]> {
    return this.cashFlowRepository.find({
      where: { year },
      relations: ['monthlyFlows'],
      order: { projectName: 'ASC' },
    });
  }

  async update(id: number, updateCashFlowDto: UpdateCashFlowDto): Promise<CashFlow> {
    const cashFlow = await this.findOne(id);

    Object.assign(cashFlow, {
      projectName: updateCashFlowDto.projectName || cashFlow.projectName,
      client: updateCashFlowDto.client || cashFlow.client,
    });

    return this.cashFlowRepository.save(cashFlow);
  }

  async remove(id: number): Promise<void> {
    const cashFlow = await this.findOne(id);
    await this.cashFlowRepository.softDelete(id);
  }

  async calculateMonthlyCashFlow(year: number, month: number): Promise<any> {
    const cashFlows = await this.findByYear(year);
    
    let totalBeginningCash = 0;
    let totalRevenue = 0;
    let totalExpense = 0;
    let totalEndingCash = 0;

    for (const cashFlow of cashFlows) {
      const targetFlow = cashFlow.monthlyFlows.find(flow => flow.month === month);
      if (targetFlow) {
        totalBeginningCash += targetFlow.beginningCash;
        totalRevenue += targetFlow.revenue;
        totalExpense += targetFlow.expense;
        totalEndingCash += targetFlow.endingCash;
      }
    }

    return {
      year,
      month,
      totalBeginningCash,
      totalRevenue,
      totalExpense,
      totalEndingCash,
      projects: cashFlows.map(cf => ({
        projectName: cf.projectName,
        monthlyFlow: cf.monthlyFlows.find(flow => flow.month === month),
      })),
    };
  }
}