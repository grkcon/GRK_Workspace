import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Employee,
  Education,
  Experience,
  LeaveBalance,
  EmployeeStatus,
} from '../../../entities';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Education)
    private educationRepository: Repository<Education>,
    @InjectRepository(Experience)
    private experienceRepository: Repository<Experience>,
    @InjectRepository(LeaveBalance)
    private leaveBalanceRepository: Repository<LeaveBalance>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    // 사번 자동 생성 (제공되지 않은 경우)
    const empNo = createEmployeeDto.empNo || (await this.generateEmpNo());
    console.log(`Creating employee with empNo: ${empNo}`);

    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      empNo, // 자동 생성된 사번 사용
      status:
        (createEmployeeDto.status as EmployeeStatus) || EmployeeStatus.ACTIVE,
      joinDate: new Date(createEmployeeDto.joinDate),
      endDate: createEmployeeDto.endDate
        ? new Date(createEmployeeDto.endDate)
        : undefined,
    });

    // 학력 정보 처리
    if (createEmployeeDto.education) {
      employee.education = createEmployeeDto.education.map((edu) =>
        this.educationRepository.create(edu),
      );
    }

    // 경력 정보 처리
    if (createEmployeeDto.experience) {
      employee.experience = createEmployeeDto.experience.map((exp) =>
        this.experienceRepository.create(exp),
      );
    }

    const savedEmployee = await this.employeeRepository.save(employee);

    // 휴가 잔여 초기화
    const leaveBalance = this.leaveBalanceRepository.create({
      employee: savedEmployee,
      year: new Date().getFullYear(),
      total: 15, // 기본 연차 15일
      used: 0,
      remaining: 15,
    });
    await this.leaveBalanceRepository.save(leaveBalance);

    return this.findOne(savedEmployee.id);
  }

  async findAll(): Promise<Employee[]> {
    return this.employeeRepository.find({
      relations: ['education', 'experience', 'leaveBalance'],
    });
  }

  async findOne(id: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: ['education', 'experience', 'leaveBalance', 'leaveRequests'],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async findByEmpNo(empNo: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { empNo },
      relations: ['education', 'experience', 'leaveBalance'],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with empNo ${empNo} not found`);
    }

    return employee;
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOne(id);

    console.log('Updating employee:', id, updateEmployeeDto);

    // 기본 정보 업데이트
    Object.assign(employee, {
      ...updateEmployeeDto,
      status: (updateEmployeeDto.status as EmployeeStatus) || employee.status,
      joinDate: updateEmployeeDto.joinDate
        ? new Date(updateEmployeeDto.joinDate)
        : employee.joinDate,
      endDate: updateEmployeeDto.endDate
        ? new Date(updateEmployeeDto.endDate)
        : employee.endDate,
    });

    // 먼저 기본 정보만 저장
    const savedEmployee = await this.employeeRepository.save(employee);

    // 학력 정보 업데이트 (별도 처리)
    if (updateEmployeeDto.education) {
      await this.educationRepository.delete({ employee: { id } });
      const educationEntities = updateEmployeeDto.education.map((edu) =>
        this.educationRepository.create({ ...edu, employee: savedEmployee }),
      );
      await this.educationRepository.save(educationEntities);
    }

    // 경력 정보 업데이트 (별도 처리)
    if (updateEmployeeDto.experience) {
      await this.experienceRepository.delete({ employee: { id } });
      const experienceEntities = updateEmployeeDto.experience.map((exp) =>
        this.experienceRepository.create({ ...exp, employee: savedEmployee }),
      );
      await this.experienceRepository.save(experienceEntities);
    }

    return this.findOne(savedEmployee.id);
  }

  async remove(id: number): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.softDelete(id);
  }

  /**
   * 삭제된 직원을 복원
   */
  async restore(id: number): Promise<Employee> {
    await this.employeeRepository.restore(id);
    return this.findOne(id);
  }

  /**
   * 삭제된 직원들 조회 (withDeleted 옵션 사용)
   */
  async findDeleted(): Promise<Employee[]> {
    return this.employeeRepository
      .find({
        where: {},
        relations: ['education', 'experience', 'leaveBalance'],
        withDeleted: true,
      })
      .then((employees) => employees.filter((emp) => emp.deletedAt != null));
  }

  /**
   * 모든 직원 조회 (삭제된 직원 포함)
   */
  async findAllWithDeleted(): Promise<Employee[]> {
    return this.employeeRepository.find({
      relations: ['education', 'experience', 'leaveBalance'],
      withDeleted: true,
    });
  }

  async getActiveEmployees(): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { status: EmployeeStatus.ACTIVE },
      relations: ['hrUnitCost', 'hrCosts'],
    });
  }

  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { department },
      relations: ['education', 'experience'],
    });
  }

  /**
   * 사번 자동 생성 (YYYYNNN 형식)
   * 예: 2025001, 2025002, ...
   */
  private async generateEmpNo(): Promise<string> {
    const year = new Date().getFullYear();

    // 해당 연도의 마지막 사번 조회
    const lastEmployee = await this.employeeRepository
      .createQueryBuilder('employee')
      .where('employee.empNo LIKE :pattern', { pattern: `${year}%` })
      .orderBy('employee.empNo', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastEmployee && lastEmployee.empNo) {
      // 마지막 3자리 숫자 추출
      const lastNumber = parseInt(lastEmployee.empNo.slice(4));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // 3자리로 패딩 (최대 999명/년)
    if (nextNumber > 999) {
      throw new Error(
        `연도별 사번 한계(999)를 초과했습니다. 현재 연도: ${year}`,
      );
    }

    return `${year}${String(nextNumber).padStart(3, '0')}`;
  }

  async updateProfileImage(id: number, imageUrl: string): Promise<Employee> {
    const employee = await this.findOne(id);
    employee.profileImageUrl = imageUrl;
    return this.employeeRepository.save(employee);
  }

  /**
   * 특정 연도/월 기준으로 실제 재직 중인 직원수를 계산합니다.
   * 퇴사일, 휴직 기간을 고려하여 해당 월에 실제 근무한 직원만 카운트합니다.
   */
  async getActiveEmployeeCountByMonth(
    year: number,
    month: number,
  ): Promise<number> {
    // 해당 월의 시작일과 종료일 계산
    const startOfMonth = new Date(year, month - 1, 1); // month는 1-12, Date는 0-11이므로 -1
    const endOfMonth = new Date(year, month, 0); // 다음 달 0일 = 현재 달 마지막 일

    console.log(
      `[DEBUG] 직원수 계산: ${year}년 ${month}월 (${startOfMonth.toISOString().split('T')[0]} ~ ${endOfMonth.toISOString().split('T')[0]})`,
    );

    // 모든 직원 조회 (삭제되지 않은 직원만)
    const allEmployees = await this.employeeRepository.find({
      relations: ['leaveRequests'],
    });

    let activeCount = 0;

    for (const employee of allEmployees) {
      // 1. 입사일이 해당 월 이후인 경우 제외
      const joinDate = new Date(employee.joinDate);
      if (joinDate > endOfMonth) {
        console.log(
          `[DEBUG] 입사일 이후: ${employee.name} (입사일: ${joinDate.toISOString().split('T')[0]})`,
        );
        continue;
      }

      // 2. 퇴사일이 해당 월 이전인 경우 제외
      if (employee.endDate) {
        const endDate = new Date(employee.endDate);
        if (endDate < startOfMonth) {
          console.log(
            `[DEBUG] 퇴사일 이전: ${employee.name} (퇴사일: ${endDate.toISOString().split('T')[0]})`,
          );
          continue;
        }
      }

      // 3. 상태가 RESIGNED인 경우 제외 (퇴사일이 없어도)
      if (employee.status === EmployeeStatus.RESIGNED) {
        console.log(`[DEBUG] 퇴사 상태: ${employee.name}`);
        continue;
      }

      // 4. 해당 월 전체가 휴직 기간에 포함되는 경우 제외
      // LeaveRequest에서 승인된 장기 휴가(휴직)를 확인
      const isOnLeaveForEntireMonth = employee.leaveRequests?.some(
        (request) => {
          if (request.status !== '승인') return false;

          const leaveStart = new Date(request.startDate);
          const leaveEnd = new Date(request.endDate);

          // 휴직 기간이 해당 월 전체를 포함하는 경우
          return leaveStart <= startOfMonth && leaveEnd >= endOfMonth;
        },
      );

      if (isOnLeaveForEntireMonth) {
        console.log(`[DEBUG] 휴직 중: ${employee.name}`);
        continue;
      }

      // 5. ON_LEAVE 상태이고 해당 월에 휴직 중인 경우 제외
      if (employee.status === EmployeeStatus.ON_LEAVE) {
        // ON_LEAVE 상태인 경우 해당 월에 승인된 휴가가 있는지 확인
        const hasLeaveInMonth = employee.leaveRequests?.some((request) => {
          if (request.status !== '승인') return false;

          const leaveStart = new Date(request.startDate);
          const leaveEnd = new Date(request.endDate);

          // 휴가 기간과 해당 월이 겹치는지 확인
          return !(leaveEnd < startOfMonth || leaveStart > endOfMonth);
        });

        if (hasLeaveInMonth) {
          console.log(`[DEBUG] 휴직 상태 및 해당 월 휴가: ${employee.name}`);
          continue;
        }
      }

      // 모든 조건을 통과한 직원은 재직 중으로 카운트
      activeCount++;
      console.log(
        `[DEBUG] 재직 중: ${employee.name} (상태: ${employee.status})`,
      );
    }

    console.log(`[DEBUG] ${year}년 ${month}월 재직 직원수: ${activeCount}명`);
    return activeCount;
  }
}
