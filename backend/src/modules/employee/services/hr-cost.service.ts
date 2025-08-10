import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeHRCost } from '../../../entities/employee-hr-cost.entity';
import { Employee } from '../../../entities/employee.entity';
import { CreateEmployeeHRCostDto, UpdateEmployeeHRCostDto, EmployeeHRCostResponseDto } from '../dto/hr-cost.dto';
import { EmployeeService } from './employee.service';
import axios from 'axios';

@Injectable()
export class EmployeeHRCostService {
  constructor(
    @InjectRepository(EmployeeHRCost)
    private readonly hrCostRepository: Repository<EmployeeHRCost>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @Inject(forwardRef(() => EmployeeService))
    private readonly employeeService: EmployeeService,
  ) {}

  /**
   * OPEX 데이터 조회 (HTTP 클라이언트 사용 - 순환 참조 방지)
   */
  private async fetchOpexData(year: number, month: number): Promise<{ totalOpex: number }> {
    try {
      const response = await axios.get(`http://localhost:3000/opex/year/${year}/month/${month}/total`);
      return { totalOpex: response.data.totalOpex || 22942469 }; // 기본값 설정
    } catch (error) {
      console.log(`OPEX 데이터 조회 실패 (${year}년 ${month}월):`, error.message);
      return { totalOpex: 22942469 }; // 기본값
    }
  }

  /**
   * 역할별 조정 비율 계산
   * 파트너: 350% (3.5)
   * 관리자: 50% (0.5)
   * 주니어: 70% (0.7)
   * 기본: 100% (1.0)
   */
  private getRoleMultiplier(position: string): number {
    const positionUpper = position.toUpperCase();
    
    // 파트너 레벨 (EP, Partner 등)
    if (positionUpper.includes('EP') || positionUpper.includes('PARTNER') || positionUpper.includes('임원')) {
      return 3.5; // 350%
    }
    
    // 관리자 레벨 (Manager, PM 등)
    if (positionUpper.includes('MANAGER') || positionUpper.includes('PM') || 
        positionUpper.includes('관리') || positionUpper.includes('매니저')) {
      return 0.5; // 50%
    }
    
    // 주니어 레벨 (Junior, 사원 등)
    if (positionUpper.includes('JUNIOR') || positionUpper.includes('JR') || 
        positionUpper.includes('사원') || positionUpper.includes('인턴')) {
      return 0.7; // 70%
    }
    
    // PR (프로젝트 매니저는 별도 처리)
    if (positionUpper === 'PR') {
      return 1.2; // 120%
    }
    
    // 시니어/선임 레벨
    if (positionUpper.includes('SENIOR') || positionUpper.includes('SR') || 
        positionUpper.includes('선임') || positionUpper.includes('SBA')) {
      return 1.0; // 100%
    }
    
    // 기본값
    return 1.0; // 100%
  }

  /**
   * Excel 기반 HR Cost 계산 로직 (월별 계산 지원)
   */
  private async calculateHRCostForMonth(
    annualSalary: number,
    bonusBaseDate: Date,
    performanceBaseDate: Date,
    bonusRate: number = 0.05,
    performanceRate: number = 1.0,
    welfareCost: number = 1700000,
    calculationDate: Date = new Date(),
    position: string = '',
    joinDate: Date = new Date(),
    year: number,
    month: number
  ) {
    // 1. 4대보험/퇴직금 계산 (연봉의 50%)
    const insuranceRetirement = Math.round(annualSalary * 0.5);

    // 2. 회사 부담금액 (연봉 + 4대보험/퇴직금)
    const companyBurden = annualSalary + insuranceRetirement;

    // 3. 월 부담액 (회사부담금액 / 12)
    const monthlyBurden = Math.round(companyBurden / 12);

    // 4. 상여금 기준일수 계산 (입사일부터 상여금기준일까지)
    // Excel: =IFERROR(DATEDIF(입사일, 상여금기준일, "d"), 0)
    const bonusBaseDays = this.calculateDaysDifference(
      joinDate, // 입사일
      bonusBaseDate instanceof Date ? bonusBaseDate : new Date(bonusBaseDate) // 상여금 기준일
    );

    // 5. PS 기준일수 계산 (입사일부터 성과급기준일까지)
    // Excel: =IFERROR(DATEDIF(입사일, 성과급기준일, "d"), 0)
    const performanceBaseDays = this.calculateDaysDifference(
      joinDate, // 입사일
      performanceBaseDate instanceof Date ? performanceBaseDate : new Date(performanceBaseDate) // 성과급 기준일
    );

    // 6. 상여금 비율 계산 (Excel 공식: 6개월 기준 비례 계산)
    // IF(기준일수>183, 5%, (기준일수/183)*5%)
    let adjustedBonusRate = bonusRate;
    if (bonusBaseDays > 183) {
      adjustedBonusRate = bonusRate; // 6개월 초과 시 전액
    } else {
      adjustedBonusRate = (bonusBaseDays / 183) * bonusRate; // 비례 계산
    }

    // 7. 성과급 비율 계산 (Excel 공식: 1년 기준 비례 계산)
    // IF(기준일수>365, 100%, (기준일수/365)*100%)
    let adjustedPerformanceRate = performanceRate;
    if (performanceBaseDays > 365) {
      adjustedPerformanceRate = performanceRate; // 1년 초과 시 전액
    } else {
      adjustedPerformanceRate = (performanceBaseDays / 365) * performanceRate; // 비례 계산
    }

    // 8. 상여금 계산 (Excel 공식: 조정된 상여금 비율 × 연봉)
    const bonusAmount = Math.round(annualSalary * adjustedBonusRate);

    // 7. 고정 인건비 (회사부담금액 + 상여금 + 복지비용)
    const fixedLaborCost = companyBurden + bonusAmount + welfareCost;

    // 8. 월 인력비 (고정인건비 / 12)
    const monthlyLaborCost = Math.round(fixedLaborCost / 12);

    // 9. 배분 정보 계산 (월별 OPEX 데이터 연동)
    // 해당 월의 실제 OPEX 데이터 가져오기
    const opexData = await this.fetchOpexData(year, month);
    const totalOpexAllocation = opexData.totalOpex;
    
    // 해당 월 실제 재직 직원수 계산
    let totalEmployees = 11; // 기본값
    try {
      totalEmployees = await this.employeeService.getActiveEmployeeCountByMonth(year, month);
      if (totalEmployees === 0) {
        totalEmployees = 11; // 직원수가 0이면 기본값 사용
      }
    } catch (error) {
      console.log(`직원수 계산 실패 (${year}년 ${month}월):`, error.message);
    }
    
    const opexAllocation = Math.round(totalOpexAllocation / totalEmployees);
    
    // EPS: 회사부담금액 × 30% × PS기준일비율 (Excel J6*V5*O6)
    // PS기준일비율은 현재 1로 고정 (1년 이상 근무 시)
    const psRatio = performanceBaseDays >= 365 ? 1.0 : (performanceBaseDays / 365);
    const eps = Math.round(companyBurden * 0.3 * psRatio);
    const monthlyEps = Math.round(eps / 12);
    
    // ECM: (월인력비 + OPEX배분 + Monthly EPS) × 50% (Excel (S6+U6+W6)*X5)
    const ecm = Math.round((monthlyLaborCost + opexAllocation + monthlyEps) * 0.5);

    // 10. 최종 인력원가: 월인력비 + OPEX배분 + Monthly EPS + ECM (Excel Y6)
    const finalLaborCost = monthlyLaborCost + opexAllocation + monthlyEps + ecm;

    // 11. 역할별 조정 비율 적용 (Excel의 VLOOKUP 역할별 퍼센트)
    const roleMultiplier = this.getRoleMultiplier(position);
    const adjustedMonthlyLaborCost = Math.round(monthlyLaborCost * roleMultiplier);
    const adjustedFinalLaborCost = Math.round(finalLaborCost * roleMultiplier);

    return {
      insuranceRetirement,
      companyBurden,
      monthlyBurden,
      bonusBaseDays,
      performanceBaseDays,
      bonusAmount,
      fixedLaborCost,
      monthlyLaborCost,
      opexAllocation,
      eps,
      monthlyEps,
      ecm,
      finalLaborCost,
      roleMultiplier, // 역할별 조정 비율
      adjustedMonthlyLaborCost, // 조정된 월 인력비
      adjustedFinalLaborCost, // 조정된 최종 인력원가
      adjustedBonusRate, // 계산된 상여금 비율
      adjustedPerformanceRate, // 계산된 성과급 비율
    };
  }

  /**
   * 두 날짜 간의 일수 계산 (Excel DATEDIF 함수와 동일한 로직)
   * =IFERROR(DATEDIF(startDate, endDate, "d"), 0)
   * 
   * @param startDate 시작일
   * @param endDate 종료일
   * @returns 일수 (오류 시 0 반환)
   */
  private calculateDaysDifference(startDate: Date, endDate: Date): number {
    try {
      // 날짜 유효성 검사
      if (!startDate || !endDate || 
          isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 0;
      }

      // 시작일이 종료일보다 늦으면 0 반환 (Excel DATEDIF 동작)
      if (startDate > endDate) {
        return 0;
      }

      // 같은 날이면 0 반환
      if (startDate.getTime() === endDate.getTime()) {
        return 0;
      }

      // Excel DATEDIF와 정확히 동일한 계산 방식
      // 시작일은 포함하지 않고, 종료일은 포함하여 계산
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const startDay = startDate.getDate();
      
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();
      const endDay = endDate.getDate();
      
      // 단순한 밀리초 차이를 일수로 변환 (UTC 기준)
      const utcStart = Date.UTC(startYear, startMonth, startDay);
      const utcEnd = Date.UTC(endYear, endMonth, endDay);
      
      const daysDifference = Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24));
      
      return daysDifference;
    } catch (error) {
      // IFERROR와 동일하게 오류 시 0 반환
      return 0;
    }
  }

  /**
   * 문자열 날짜를 Date 객체로 변환 (안전한 변환)
   * @param dateString YYYY-MM-DD 형식의 날짜 문자열
   * @returns Date 객체 (유효하지 않으면 null)
   */
  private parseDate(dateString: string | Date): Date | null {
    try {
      if (dateString instanceof Date) {
        return isNaN(dateString.getTime()) ? null : dateString;
      }
      
      if (typeof dateString !== 'string') {
        return null;
      }

      // YYYY-MM-DD 형식 검증
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        return null;
      }

      const date = new Date(dateString + 'T00:00:00.000Z'); // UTC 기준으로 파싱
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }

  /**
   * 직원의 HR Cost 생성
   */
  async create(createDto: CreateEmployeeHRCostDto): Promise<EmployeeHRCost> {
    // 직원 존재 확인
    const employee = await this.employeeRepository.findOne({
      where: { id: createDto.employeeId }
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${createDto.employeeId} not found`);
    }

    // 중복 확인 (직원별 연도별 유니크)
    const existingHRCost = await this.hrCostRepository.findOne({
      where: {
        employee: { id: createDto.employeeId },
        year: createDto.year
      }
    });

    if (existingHRCost) {
      throw new ConflictException(
        `HR Cost data already exists for employee ${createDto.employeeId} in year ${createDto.year}`
      );
    }

    // 계산 실행
    const calculationDate = new Date();
    const bonusBaseDate = new Date(createDto.bonusBaseDate);
    const performanceBaseDate = new Date(createDto.performanceBaseDate);
    
    const calculations = await this.calculateHRCostForMonth(
      createDto.annualSalary,
      bonusBaseDate,
      performanceBaseDate,
      createDto.bonusRate || 0.05,
      createDto.performanceRate || 1.0,
      createDto.welfareCost || 1700000,
      calculationDate,
      employee.position, // 직원의 직급/역할 정보 전달
      new Date(employee.joinDate), // 입사일 전달
      createDto.year,
      calculationDate.getMonth() + 1 // 생성 시점의 월 기준
    );

    // 엔티티 생성
    const hrCost = this.hrCostRepository.create({
      employee,
      year: createDto.year,
      annualSalary: createDto.annualSalary,
      bonusBaseDate,
      performanceBaseDate,
      bonusRate: createDto.bonusRate || 0.05,
      performanceRate: createDto.performanceRate || 1.0,
      welfareCost: createDto.welfareCost || 1700000,
      memo: createDto.memo,
      calculationDate,
      ...calculations,
    });

    return await this.hrCostRepository.save(hrCost);
  }

  /**
   * 직원의 특정 연도-월 HR Cost 조회
   */
  async findByEmployeeYearMonth(employeeId: number, year: number, month: number): Promise<EmployeeHRCostResponseDto> {
    const hrCost = await this.hrCostRepository.findOne({
      where: {
        employee: { id: employeeId },
        year: year
      },
      relations: ['employee']
    });

    if (!hrCost) {
      // HR Cost 데이터가 없는 경우 기본값으로 자동 생성
      const employee = await this.employeeRepository.findOne({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      // 기본값으로 HR Cost 생성
      const defaultAnnualSalary = employee.monthlySalary ? Number(employee.monthlySalary) * 12 : 50000000;
      
      const createDto: CreateEmployeeHRCostDto = {
        employeeId,
        year,
        annualSalary: defaultAnnualSalary,
        bonusBaseDate: `${year}-06-30`,
        performanceBaseDate: `${year}-12-31`,
      };

      const newHRCost = await this.create(createDto);
      // 월별 재계산
      const employee2 = newHRCost.employee;
      const calculations = await this.calculateHRCostForMonth(
        Number(newHRCost.annualSalary),
        newHRCost.bonusBaseDate,
        newHRCost.performanceBaseDate,
        Number(newHRCost.bonusRate),
        Number(newHRCost.performanceRate),
        Number(newHRCost.welfareCost),
        new Date(),
        employee2.position,
        new Date(employee2.joinDate),
        year,
        month
      );
      
      const updatedHRCost = {
        ...newHRCost,
        ...calculations,
        calculationDate: new Date(),
      };
      
      return this.formatResponse(updatedHRCost as any);
    }

    // 기존 데이터가 있어도 최신 계산 로직으로 재계산 (월별)
    const employee = hrCost.employee;
    const calculations = await this.calculateHRCostForMonth(
      Number(hrCost.annualSalary),
      hrCost.bonusBaseDate,
      hrCost.performanceBaseDate,
      Number(hrCost.bonusRate),
      Number(hrCost.performanceRate),
      Number(hrCost.welfareCost),
      new Date(),
      employee.position,
      new Date(employee.joinDate),
      year,
      month
    );

    // 계산된 값들 업데이트 (DB에 저장하지 않고 응답에만 반영)
    const updatedHRCost = {
      ...hrCost,
      ...calculations,
      calculationDate: new Date(),
    };

    return this.formatResponse(updatedHRCost as any);
  }

  /**
   * 직원의 특정 연도 HR Cost 조회
   */
  async findByEmployeeAndYear(employeeId: number, year: number): Promise<EmployeeHRCostResponseDto> {
    const hrCost = await this.hrCostRepository.findOne({
      where: {
        employee: { id: employeeId },
        year: year
      },
      relations: ['employee']
    });

    if (!hrCost) {
      // HR Cost 데이터가 없는 경우 기본값으로 자동 생성
      const employee = await this.employeeRepository.findOne({
        where: { id: employeeId }
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      // 기본값으로 HR Cost 생성
      const defaultAnnualSalary = employee.monthlySalary ? Number(employee.monthlySalary) * 12 : 50000000;
      
      const createDto: CreateEmployeeHRCostDto = {
        employeeId,
        year,
        annualSalary: defaultAnnualSalary,
        bonusBaseDate: `${year}-06-30`,
        performanceBaseDate: `${year}-12-31`,
      };

      const newHRCost = await this.create(createDto);
      return this.formatResponse(newHRCost);
    }

    // 기존 데이터가 있어도 최신 계산 로직으로 재계산 (현재 월 기준)
    const employee = hrCost.employee;
    const currentDate = new Date();
    const calculations = await this.calculateHRCostForMonth(
      Number(hrCost.annualSalary), // 문자열을 숫자로 변환
      hrCost.bonusBaseDate,
      hrCost.performanceBaseDate,
      Number(hrCost.bonusRate), // 문자열을 숫자로 변환
      Number(hrCost.performanceRate), // 문자열을 숫자로 변환
      Number(hrCost.welfareCost), // 문자열을 숫자로 변환
      new Date(),
      employee.position, // 직원의 직급/역할 정보 전달
      new Date(employee.joinDate), // 입사일 전달
      year,
      currentDate.getMonth() + 1 // 현재 월 기준
    );

    // 계산된 값들 업데이트 (DB에 저장하지 않고 응답에만 반영)
    const updatedHRCost = {
      ...hrCost,
      ...calculations,
      calculationDate: new Date(),
    };

    return this.formatResponse(updatedHRCost as any);
  }

  /**
   * HR Cost 업데이트
   */
  async update(employeeId: number, year: number, updateDto: UpdateEmployeeHRCostDto): Promise<EmployeeHRCost> {
    const hrCost = await this.hrCostRepository.findOne({
      where: {
        employee: { id: employeeId },
        year: year
      },
      relations: ['employee']
    });

    if (!hrCost) {
      throw new NotFoundException(`HR Cost not found for employee ${employeeId} in year ${year}`);
    }

    // 업데이트할 필드들
    if (updateDto.annualSalary !== undefined) {
      hrCost.annualSalary = updateDto.annualSalary;
    }
    if (updateDto.bonusBaseDate !== undefined) {
      hrCost.bonusBaseDate = new Date(updateDto.bonusBaseDate);
    }
    if (updateDto.performanceBaseDate !== undefined) {
      hrCost.performanceBaseDate = new Date(updateDto.performanceBaseDate);
    }
    if (updateDto.bonusRate !== undefined) {
      hrCost.bonusRate = updateDto.bonusRate;
    }
    if (updateDto.performanceRate !== undefined) {
      hrCost.performanceRate = updateDto.performanceRate;
    }
    if (updateDto.welfareCost !== undefined) {
      hrCost.welfareCost = updateDto.welfareCost;
    }
    if (updateDto.memo !== undefined) {
      hrCost.memo = updateDto.memo;
    }

    // 재계산
    const currentDate = new Date();
    const calculations = await this.calculateHRCostForMonth(
      Number(hrCost.annualSalary), // 문자열을 숫자로 변환
      hrCost.bonusBaseDate,
      hrCost.performanceBaseDate,
      Number(hrCost.bonusRate), // 문자열을 숫자로 변환
      Number(hrCost.performanceRate), // 문자열을 숫자로 변환
      Number(hrCost.welfareCost), // 문자열을 숫자로 변환
      new Date(),
      hrCost.employee.position, // 직원의 직급/역할 정보 전달
      new Date(hrCost.employee.joinDate), // 입사일 전달
      year,
      currentDate.getMonth() + 1 // 현재 월 기준
    );

    // 계산된 값들 업데이트
    Object.assign(hrCost, calculations);
    hrCost.calculationDate = new Date();

    return await this.hrCostRepository.save(hrCost);
  }

  /**
   * 응답 포맷팅
   */
  private formatResponse(hrCost: EmployeeHRCost): EmployeeHRCostResponseDto {
    return {
      id: hrCost.id,
      year: hrCost.year,
      annualSalary: hrCost.annualSalary,
      joinDate: hrCost.employee.joinDate,
      bonusBaseDate: hrCost.bonusBaseDate,
      performanceBaseDate: hrCost.performanceBaseDate,
      insuranceRetirement: hrCost.insuranceRetirement,
      companyBurden: hrCost.companyBurden,
      monthlyBurden: hrCost.monthlyBurden,
      bonusBaseDays: hrCost.bonusBaseDays,
      bonusRate: hrCost.bonusRate,
      performanceBaseDays: hrCost.performanceBaseDays,
      performanceRate: hrCost.performanceRate,
      bonusAmount: hrCost.bonusAmount,
      welfareCost: hrCost.welfareCost,
      fixedLaborCost: hrCost.fixedLaborCost,
      monthlyLaborCost: hrCost.monthlyLaborCost,
      opexAllocation: hrCost.opexAllocation,
      eps: hrCost.eps,
      monthlyEps: hrCost.monthlyEps,
      ecm: hrCost.ecm,
      finalLaborCost: hrCost.finalLaborCost,
      roleMultiplier: hrCost.roleMultiplier,
      adjustedMonthlyLaborCost: hrCost.adjustedMonthlyLaborCost,
      adjustedFinalLaborCost: hrCost.adjustedFinalLaborCost,
      memo: hrCost.memo,
      calculationFormulas: {
        companyBurden: '연봉 + 4대보험/퇴직금',
        fixedLaborCost: '회사부담금액 + 상여금 + 복지비용',
        monthlyLaborCost: '고정 인건비 ÷ 12',
        insuranceRetirement: '연봉 × 50% (대략)',
      },
      createdAt: hrCost.createdAt,
      updatedAt: hrCost.updatedAt,
    };
  }

  /**
   * 직원의 모든 HR Cost 이력 조회
   */
  async findAllByEmployee(employeeId: number): Promise<EmployeeHRCostResponseDto[]> {
    const hrCosts = await this.hrCostRepository.find({
      where: { employee: { id: employeeId } },
      relations: ['employee'],
      order: { year: 'DESC' }
    });

    return hrCosts.map(hrCost => this.formatResponse(hrCost));
  }

  /**
   * 모든 직원의 특정 연도/월 HR Cost 조회
   */
  async findAllEmployeesHRCost(year: number, month: number): Promise<Array<{
    employee: {
      id: number;
      name: string;
      position: string;
      department: string;
      monthlySalary: string;
    };
    hrCost: EmployeeHRCostResponseDto;
  }>> {
    // 활성 직원 목록 조회
    const activeEmployees = await this.employeeRepository.find({
      where: { 
        status: 'ACTIVE' as any
      },
      order: { name: 'ASC' }
    });

    const results: Array<{
      employee: {
        id: number;
        name: string;
        position: string;
        department: string;
        monthlySalary: string;
      };
      hrCost: EmployeeHRCostResponseDto;
    }> = [];
    
    for (const employee of activeEmployees) {
      try {
        // 각 직원의 HR Cost 계산
        const hrCost = await this.findByEmployeeYearMonth(employee.id, year, month);
        
        results.push({
          employee: {
            id: employee.id,
            name: employee.name,
            position: employee.position,
            department: employee.department,
            monthlySalary: String(employee.monthlySalary || '0'),
          },
          hrCost
        });
      } catch (error) {
        console.error(`HR Cost 계산 실패 - 직원: ${employee.name} (ID: ${employee.id}):`, error.message);
        // 에러가 발생해도 다른 직원들은 계속 처리
        continue;
      }
    }

    return results;
  }
}