export enum OpexType {
  INDIRECT = 'indirect',
  DIRECT = 'direct'
}

export enum OpexRelationshipType {
  MONTHLY_OPEX = 'monthly_opex',
  PPE_INDIRECT = 'ppe_indirect', 
  PPE_DIRECT = 'ppe_direct',
}

export interface OpexItem {
  id: number;
  category: string;
  amount: number;
  note?: string;
  type: OpexType;
  relationshipType: OpexRelationshipType;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyOpex {
  id: number;
  month: number;
  employeeCount: number;
  confirmed: boolean;
  opexItems: OpexItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface YearlyOpex {
  id: number;
  year: number;
  months: MonthlyOpex[];
  createdAt: Date;
  updatedAt: Date;
}

// 프론트엔드에서 사용하는 기존 인터페이스 (호환성 유지)
export interface MonthlyOpexData {
  month: number;
  employeeCount: number;
  confirmed: boolean;
  indirect: OpexItem[];
  direct: OpexItem[];
  exchangeRate?: {
    usdToKrw: number;
    date: string;
    change?: number;
  };
}

export interface YearlyOpexData {
  year: number;
  months: MonthlyOpexData[];
}

// API 생성용 DTO
export interface CreateOpexItemDto {
  category: string;
  amount: number;
  note?: string;
  type: OpexType;
}

export interface CreateMonthlyOpexDto {
  month: number;
  employeeCount?: number;
  confirmed?: boolean;
  opexItems: CreateOpexItemDto[];
}

export interface CreateYearlyOpexDto {
  year: number;
  months: CreateMonthlyOpexDto[];
}

export interface UpdateYearlyOpexDto extends Partial<CreateYearlyOpexDto> {}