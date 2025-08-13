import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Length,
  Matches,
  Min,
  Max,
  IsEnum,
  IsNotEmpty,
  ArrayMaxSize,
  IsPositive,
  ValidateBy,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus } from '../../../entities';

// 한국 주민등록번호 유효성 검증 함수
function validateKoreanSSN(ssn: string): boolean {
  if (!ssn || typeof ssn !== 'string') return false;
  
  // 형식 체크: 6자리-7자리
  const ssnRegex = /^(\d{6})-(\d{7})$/;
  const match = ssn.match(ssnRegex);
  if (!match) return false;
  
  const [, front, back] = match;
  
  // 생년월일 유효성 검사
  const year = parseInt(front.substring(0, 2));
  const month = parseInt(front.substring(2, 4));
  const day = parseInt(front.substring(4, 6));
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // 월별 일수 체크
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // 윤년 계산 (1900년대, 2000년대 고려)
  const genderCode = parseInt(back.charAt(0));
  let fullYear: number;
  
  if (genderCode === 1 || genderCode === 2) {
    fullYear = 1900 + year;
  } else if (genderCode === 3 || genderCode === 4) {
    fullYear = 2000 + year;
  } else {
    return false; // 유효하지 않은 성별 코드
  }
  
  // 윤년 체크
  const isLeapYear = (fullYear % 4 === 0 && fullYear % 100 !== 0) || (fullYear % 400 === 0);
  if (month === 2 && isLeapYear) {
    daysInMonth[1] = 29;
  }
  
  if (day > daysInMonth[month - 1]) return false;
  
  // 체크섬 검증
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  const digits = (front + back.substring(0, 6)).split('').map(Number);
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weights[i];
  }
  
  const checkDigit = (11 - (sum % 11)) % 10;
  const lastDigit = parseInt(back.charAt(6));
  
  return checkDigit === lastDigit;
}

export class CreateEducationDto {
  @ApiPropertyOptional({ description: 'School name', maxLength: 100 })
  @IsOptional()
  @IsString({ message: '학교명은 문자열이어야 합니다.' })
  @Length(0, 100, { message: '학교명은 100자 이하여야 합니다.' })
  school?: string;

  @ApiPropertyOptional({ description: 'Major field of study', maxLength: 100 })
  @IsOptional()
  @IsString({ message: '전공은 문자열이어야 합니다.' })
  @Length(0, 100, { message: '전공은 100자 이하여야 합니다.' })
  major?: string;

  @ApiPropertyOptional({ description: 'Degree type', maxLength: 50 })
  @IsOptional()
  @IsString({ message: '학위는 문자열이어야 합니다.' })
  @Length(0, 50, { message: '학위는 50자 이하여야 합니다.' })
  degree?: string;

  @ApiPropertyOptional({ description: 'Start date (admission date)' })
  @IsDateString({}, { message: '입학일은 올바른 날짜 형식이어야 합니다.' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Graduation date' })
  @IsDateString({}, { message: '졸업일은 올바른 날짜 형식이어야 합니다.' })
  @IsOptional()
  graduationDate?: string;
}

export class CreateExperienceDto {
  @ApiPropertyOptional({ description: 'Company name', maxLength: 100 })
  @IsOptional()
  @IsString({ message: '회사명은 문자열이어야 합니다.' })
  @Length(0, 100, { message: '회사명은 100자 이하여야 합니다.' })
  company?: string;

  @ApiPropertyOptional({ description: 'Department', maxLength: 100 })
  @IsOptional()
  @IsString({ message: '부서명은 문자열이어야 합니다.' })
  @Length(0, 100, { message: '부서명은 100자 이하여야 합니다.' })
  department?: string;

  @ApiPropertyOptional({ description: 'Position title', maxLength: 100 })
  @IsOptional()
  @IsString({ message: '직급은 문자열이어야 합니다.' })
  @Length(0, 100, { message: '직급은 1자 이상 100자 이하여야 합니다.' })
  position?: string;

  @ApiPropertyOptional({ description: 'Start date (join date)' })
  @IsDateString({}, { message: '입사일은 올바른 날짜 형식이어야 합니다.' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (leave date)' })
  @IsDateString({}, { message: '퇴사일은 올바른 날짜 형식이어야 합니다.' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Annual salary at previous company',
    minimum: 0,
  })
  @IsNumber({}, { message: '연봉은 숫자여야 합니다.' })
  @IsPositive({ message: '연봉은 양수여야 합니다.' })
  @IsOptional()
  annualSalary?: number;
}

export class CreateEmployeeDto {
  @ApiProperty({ description: 'Employee name', minLength: 2, maxLength: 50 })
  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '이름은 필수 입력 항목입니다.' })
  @Length(2, 50, { message: '이름은 2자 이상 50자 이하여야 합니다.' })
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '이름은 한글, 영문, 공백만 입력 가능합니다.',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Employee number (auto-generated if not provided)',
  })
  @IsString({ message: '사번은 문자열이어야 합니다.' })
  @IsOptional()
  @Length(7, 7, { message: '사번은 7자리여야 합니다.' })
  @Matches(/^\d{7}$/, { message: '사번은 7자리 숫자여야 합니다.' })
  empNo?: string;

  @ApiProperty({ description: 'Position', minLength: 1, maxLength: 50 })
  @IsString({ message: '직급은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '직급은 필수 입력 항목입니다.' })
  @Length(1, 50, { message: '직급은 1자 이상 50자 이하여야 합니다.' })
  position: string;

  @ApiPropertyOptional({ description: 'Rank', maxLength: 50 })
  @IsOptional()
  @IsString({ message: '직책은 문자열이어야 합니다.' })
  @Length(0, 50, { message: '직책은 50자 이하여야 합니다.' })
  rank?: string;

  @ApiProperty({ description: 'Department', minLength: 1, maxLength: 50 })
  @IsString({ message: '부서는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '부서는 필수 입력 항목입니다.' })
  @Length(1, 50, { message: '부서는 1자 이상 50자 이하여야 합니다.' })
  department: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString({ message: '전화번호는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '전화번호는 필수 입력 항목입니다.' })
  @Matches(/^[0-9-]+$/, {
    message: '전화번호는 숫자와 하이픈만 입력 가능합니다.',
  })
  @Length(10, 20, { message: '전화번호는 10자 이상 20자 이하여야 합니다.' })
  tel: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
  @Length(5, 100, { message: '이메일은 5자 이상 100자 이하여야 합니다.' })
  email: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  @IsString({ message: '프로필 이미지 URL은 문자열이어야 합니다.' })
  @IsOptional()
  profileImageUrl?: string;


  @ApiProperty({ description: 'Join date' })
  @IsDateString({}, { message: '입사일은 올바른 날짜 형식이어야 합니다.' })
  @IsNotEmpty({ message: '입사일은 필수 입력 항목입니다.' })
  joinDate: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString({}, { message: '퇴사일은 올바른 날짜 형식이어야 합니다.' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Monthly salary', minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: '월급은 숫자여야 합니다.' })
  @IsPositive({ message: '월급은 양수여야 합니다.' })
  monthlySalary?: number;

  @ApiPropertyOptional({ description: 'Employee status' })
  @IsString({ message: '직원 상태는 문자열이어야 합니다.' })
  @IsEnum(EmployeeStatus, { message: '올바른 직원 상태가 아닙니다.' })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Social security number' })
  @IsString({ message: '주민등록번호는 문자열이어야 합니다.' })
  @IsOptional()
  @Matches(/^(\d{6}-\d{7}|)$/, {
    message: '주민등록번호는 "123456-1234567" 형식이어야 합니다.',
  })
  @ValidateBy(
    {
      name: 'isValidKoreanSSN',
      validator: {
        validate: (value: string) => {
          if (!value || value.trim() === '') return true; // 선택사항이므로 빈 값 허용
          return validateKoreanSSN(value);
        },
        defaultMessage: () => '유효하지 않은 주민등록번호입니다.',
      },
    },
  )
  ssn?: string;

  @ApiPropertyOptional({ description: 'Bank name', maxLength: 50 })
  @IsString({ message: '은행명은 문자열이어야 합니다.' })
  @IsOptional()
  @Length(0, 50, { message: '은행명은 50자 이하여야 합니다.' })
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank account', maxLength: 50 })
  @IsString({ message: '계좌번호는 문자열이어야 합니다.' })
  @IsOptional()
  @Matches(/^([0-9-]+|)$/, {
    message: '계좌번호는 숫자와 하이픈만 입력 가능합니다.',
  })
  @Length(0, 50, { message: '계좌번호는 50자 이하여야 합니다.' })
  bankAccount?: string;

  @ApiPropertyOptional({
    description: 'Consultant introduction (max 500 characters)',
    maxLength: 500,
  })
  @IsString({ message: '컨설턴트 소개는 문자열이어야 합니다.' })
  @IsOptional()
  @Length(0, 500, { message: '컨설턴트 소개는 500자 이하여야 합니다.' })
  consultantIntroduction?: string;

  @ApiPropertyOptional({
    description: 'Education history',
    type: [CreateEducationDto],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray({ message: '학력 정보는 배열이어야 합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CreateEducationDto)
  @ArrayMaxSize(10, { message: '학력 정보는 최대 10개까지 입력 가능합니다.' })
  education?: CreateEducationDto[];

  @ApiPropertyOptional({
    description: 'Work experience',
    type: [CreateExperienceDto],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray({ message: '경력 정보는 배열이어야 합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceDto)
  @ArrayMaxSize(20, { message: '경력 정보는 최대 20개까지 입력 가능합니다.' })
  experience?: CreateExperienceDto[];
}
