import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee, Education, Experience, LeaveBalance, EmployeeStatus } from '../../../entities';
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
    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      status: createEmployeeDto.status as EmployeeStatus || EmployeeStatus.ACTIVE,
      joinDate: new Date(createEmployeeDto.joinDate),
      endDate: createEmployeeDto.endDate ? new Date(createEmployeeDto.endDate) : undefined,
    });

    // 학력 정보 처리
    if (createEmployeeDto.education) {
      employee.education = createEmployeeDto.education.map(edu =>
        this.educationRepository.create(edu)
      );
    }

    // 경력 정보 처리
    if (createEmployeeDto.experience) {
      employee.experience = createEmployeeDto.experience.map(exp =>
        this.experienceRepository.create(exp)
      );
    }

    const savedEmployee = await this.employeeRepository.save(employee) as Employee;

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

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);

    // 기본 정보 업데이트
    Object.assign(employee, {
      ...updateEmployeeDto,
      joinDate: updateEmployeeDto.joinDate ? new Date(updateEmployeeDto.joinDate) : employee.joinDate,
      endDate: updateEmployeeDto.endDate ? new Date(updateEmployeeDto.endDate) : employee.endDate,
    });

    // 학력 정보 업데이트
    if (updateEmployeeDto.education) {
      await this.educationRepository.delete({ employee: { id } });
      employee.education = updateEmployeeDto.education.map(edu =>
        this.educationRepository.create({ ...edu, employee })
      );
    }

    // 경력 정보 업데이트
    if (updateEmployeeDto.experience) {
      await this.experienceRepository.delete({ employee: { id } });
      employee.experience = updateEmployeeDto.experience.map(exp =>
        this.experienceRepository.create({ ...exp, employee })
      );
    }

    return this.employeeRepository.save(employee);
  }

  async remove(id: number): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.softDelete(id);
  }

  async getActiveEmployees(): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { status: EmployeeStatus.ACTIVE },
      relations: ['hrUnitCost'],
    });
  }

  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { department },
      relations: ['education', 'experience'],
    });
  }
}