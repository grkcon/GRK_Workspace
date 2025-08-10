import { Injectable } from '@nestjs/common';

@Injectable()
export class CashFlowCalculator {
  /**
   * 엑셀 공식: =G7+G35-G8 (기말현금 = 기초현금 + 수입 - 지출)
   */
  calculateEndingCash(
    beginningCash: number,
    revenue: number,
    expense: number,
  ): number {
    return beginningCash + revenue - expense;
  }

  /**
   * 월별 지출 계산 (인력비 + 간접비 + 직접비 + 상여금)
   */
  calculateMonthlyExpense(
    laborCost: number,
    indirectOpex: number,
    directOpex: number,
    bonus: number = 0,
  ): number {
    return laborCost + indirectOpex + directOpex + bonus;
  }

  /**
   * 프로젝트 손익 계산
   * 엑셀 공식: 매출 - 원가 - 운영비 = 순이익
   */
  calculateProjectProfit(
    revenue: number,
    laborCost: number,
    outsourcingCost: number,
    opexCost: number,
  ) {
    const grossIncome = revenue - laborCost - outsourcingCost;
    const operationIncome = grossIncome - opexCost;

    return {
      grossIncome,
      grossIncomeRate: revenue > 0 ? (grossIncome / revenue) * 100 : 0,
      operationIncome,
      operationIncomeRate: revenue > 0 ? (operationIncome / revenue) * 100 : 0,
      profit: operationIncome,
      profitRate: revenue > 0 ? (operationIncome / revenue) * 100 : 0,
    };
  }

  /**
   * 운영비 자동 계산 (매출의 10%)
   * 엑셀 공식: =L6*10%
   */
  calculateOpexCost(revenue: number, opexRate: number = 0.1): number {
    return revenue * opexRate;
  }

  /**
   * ECM (Expected Contract Margin) 계산
   * 엑셀 공식: =F33*(0.45/1.45)
   */
  calculateECM(contractValue: number): number {
    return contractValue * (0.45 / 1.45);
  }

  /**
   * 연간 총합 계산
   */
  calculateAnnualTotal(monthlyValues: number[]): number {
    return monthlyValues.reduce((sum, value) => sum + value, 0);
  }

  /**
   * 월별 비율 계산
   */
  calculateMonthlyRate(monthlyValue: number, annualTotal: number): number {
    return annualTotal > 0 ? (monthlyValue / annualTotal) * 100 : 0;
  }
}
