export class EmployeeCRDto {
  id: number;
  emp_no: string;
  name: string;
  department: string;
  position: string;
  totalCR: number;
}

export class CRDetailDto {
  employeeId: number;
  projectName: string;
  projectRevenue: number;
  costWeight: number;
  cr: number;
}