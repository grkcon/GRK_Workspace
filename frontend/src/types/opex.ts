export interface OpexItem {
  id: number;
  category: string;
  amount: number;
  note: string;
}

export interface MonthlyOpexData {
  month: number;
  employeeCount: number;
  confirmed: boolean;
  indirect: OpexItem[];
  direct: OpexItem[];
}

export interface YearlyOpexData {
  year: number;
  months: MonthlyOpexData[];
}