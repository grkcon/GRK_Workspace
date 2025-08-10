import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest, Employee, LeaveBalance, RequestStatus } from '../../../entities';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from '../dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(LeaveBalance)
    private leaveBalanceRepository: Repository<LeaveBalance>,
  ) {}

  async create(createLeaveRequestDto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    const employee = await this.employeeRepository.findOne({
      where: { id: createLeaveRequestDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${createLeaveRequestDto.employeeId} not found`);
    }

    const leaveRequest = this.leaveRequestRepository.create({
      ...createLeaveRequestDto,
      employee,
      requestDate: createLeaveRequestDto.requestDate ? new Date(createLeaveRequestDto.requestDate) : new Date(),
      startDate: new Date(createLeaveRequestDto.startDate),
      endDate: new Date(createLeaveRequestDto.endDate),
    });

    return this.leaveRequestRepository.save(leaveRequest);
  }

  async findAll(): Promise<LeaveRequest[]> {
    return this.leaveRequestRepository.find({
      relations: ['employee'],
      order: { requestDate: 'DESC' },
    });
  }

  async findByEmployee(employeeId: number): Promise<LeaveRequest[]> {
    return this.leaveRequestRepository.find({
      where: { employee: { id: employeeId } },
      relations: ['employee'],
      order: { requestDate: 'DESC' },
    });
  }

  async findByStatus(status: RequestStatus): Promise<LeaveRequest[]> {
    return this.leaveRequestRepository.find({
      where: { status },
      relations: ['employee'],
      order: { requestDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    return leaveRequest;
  }

  async update(id: number, updateLeaveRequestDto: UpdateLeaveRequestDto): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);

    // Update dates if provided
    if (updateLeaveRequestDto.startDate) {
      leaveRequest.startDate = new Date(updateLeaveRequestDto.startDate);
    }
    if (updateLeaveRequestDto.endDate) {
      leaveRequest.endDate = new Date(updateLeaveRequestDto.endDate);
    }

    Object.assign(leaveRequest, updateLeaveRequestDto);

    return this.leaveRequestRepository.save(leaveRequest);
  }

  async remove(id: number): Promise<void> {
    const leaveRequest = await this.findOne(id);
    await this.leaveRequestRepository.remove(leaveRequest);
  }

  async approveRequest(id: number, approver: string): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);
    
    leaveRequest.status = RequestStatus.APPROVED;
    leaveRequest.approver = approver;

    // Update leave balance if approved
    await this.updateLeaveBalance(leaveRequest.employee.id, leaveRequest.days);

    return this.leaveRequestRepository.save(leaveRequest);
  }

  async rejectRequest(id: number, rejectReason: string): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);
    
    leaveRequest.status = RequestStatus.REJECTED;
    leaveRequest.rejectReason = rejectReason;

    return this.leaveRequestRepository.save(leaveRequest);
  }

  async getLeaveBalance(employeeId: number): Promise<LeaveBalance> {
    let leaveBalance = await this.leaveBalanceRepository.findOne({
      where: { employee: { id: employeeId } },
    });

    if (!leaveBalance) {
      // Create default leave balance if not exists
      const employee = await this.employeeRepository.findOne({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      leaveBalance = this.leaveBalanceRepository.create({
        employee,
        year: new Date().getFullYear(),
        total: 15, // Default annual leave
        used: 0,
        remaining: 15,
      });

      leaveBalance = await this.leaveBalanceRepository.save(leaveBalance);
    }

    return leaveBalance;
  }

  private async updateLeaveBalance(employeeId: number, days: number): Promise<void> {
    const leaveBalance = await this.getLeaveBalance(employeeId);
    
    leaveBalance.used = parseFloat(leaveBalance.used.toString()) + days;
    leaveBalance.remaining = parseFloat(leaveBalance.total.toString()) - parseFloat(leaveBalance.used.toString());

    await this.leaveBalanceRepository.save(leaveBalance);
  }
}