export interface Employee {
  id: number;
  empNo: string;
  name: string;
  email: string;
  position: string;
  rank: string;
  department: string;
  tel: string;
  age: number;
  joinDate: Date;
  endDate?: Date;
  monthlySalary: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  profileImageUrl?: string;
  ssn?: string;
  bankName?: string;
  bankAccount?: string;
  consultantIntroduction?: string;
  education?: Education[];
  experience?: Experience[];
  leaveBalance?: LeaveBalance[];
  hrUnitCost?: HRUnitCost;
  hrCosts?: EmployeeHRCost[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Education {
  id: number;
  degree: string;
  major: string;
  school: string;
  startDate?: Date;
  graduationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Experience {
  id: number;
  company: string;
  department: string;
  position: string;
  startDate?: Date;
  endDate?: Date;
  annualSalary?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalance {
  id: number;
  year: number;
  total: number;
  used: number;
  remaining: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HRUnitCost {
  id: number;
  yearMonth: string;
  unitCost: number;
  overtimeRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeHRCost {
  id: number;
  year: number;
  annualSalary: number;
  bonusBaseDate: Date;
  performanceBaseDate: Date;
  insuranceRetirement: number;
  companyBurden: number;
  monthlyBurden: number;
  bonusBaseDays: number;
  bonusRate: number;
  performanceBaseDays: number;
  performanceRate: number;
  bonusAmount: number;
  welfareCost: number;
  fixedLaborCost: number;
  monthlyLaborCost: number;
  opexAllocation: number;
  eps: number;
  monthlyEps: number;
  ecm: number;
  finalLaborCost: number;
  roleMultiplier: number;
  adjustedMonthlyLaborCost: number;
  adjustedFinalLaborCost: number;
  memo?: string;
  calculationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}