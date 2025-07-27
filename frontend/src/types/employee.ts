export interface Employee {
  id: number;
  name: string;
  emp_no: string;
  position: string;
  department: string;
  status: '재직' | '휴직' | '퇴사';
  join_date: string;
  end_date?: string;
  email?: string;
  ssn?: string;
  salary?: string;
  bank_account?: string;
  education?: Education[];
  experience?: Experience[];
}

export interface Education {
  id?: number;
  school: string;
  major: string;
  degree: string;
}

export interface Experience {
  id?: number;
  company: string;
  department: string;
  position: string;
}