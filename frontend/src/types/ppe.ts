export interface Project {
  id: number;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  pm: string;
  contractValue: number;
  status: '진행중' | '완료' | '계획';
}

export interface ProjectPayment {
  downPayment: number;      // 계약금
  middlePayment: number;    // 중도금
  finalPayment: number;     // 잔금
}

export interface ProjectClient {
  name: string;
  contactPerson: string;
  contactNumber: string;
}

export interface InternalStaff {
  id?: number;
  hrId: number;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  utilization: number;      // 투입율 %
  exclusionDays: number;    // 투입제외일
  totalCost: number;        // 총 투입원가
  monthlyCost?: number;     // 월 원가
}

export interface ExternalStaff {
  id?: number;
  name: string;
  role: string;
  contact: string;
  period: string;
  cost: number;
  memo: string;
  attachment?: string;
}

export interface OpexItem {
  id?: number;
  category: string;
  amount: number;
  note: string;
}

export interface ProjectPPE {
  projectId: number;
  revenue: number;          // 매출액
  laborCost: number;        // 투입인건비
  outsourcingCost: number;  // 외주비용
  opexCost: number;         // OPEX
  grossIncome: number;      // Gross Income
  grossIncomeRate: number;  // Gross Income %
  operationIncome: number;  // Operation Income
  operationIncomeRate: number; // Operation Income %
  profit: number;           // Profit
  profitRate: number;       // Profit %
  payment: ProjectPayment;
  client: ProjectClient;
  internalStaff?: InternalStaff[];
  externalStaff?: ExternalStaff[];
  indirectOpex?: OpexItem[];
  directOpex?: OpexItem[];
}

export interface HRMaster {
  hrId: number;
  name: string;
  monthlyCost: number;
}