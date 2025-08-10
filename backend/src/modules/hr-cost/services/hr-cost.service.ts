import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HRUnitCost, Employee } from '../../../entities';
import { CreateHRCostDto, UpdateHRCostDto } from '../dto';

@Injectable()
export class HRCostService {
  constructor(
    @InjectRepository(HRUnitCost)
    private hrCostRepository: Repository<HRUnitCost>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createHRCostDto: CreateHRCostDto): Promise<HRUnitCost> {
    const employee = await this.employeeRepository.findOne({
      where: { id: createHRCostDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${createHRCostDto.employeeId} not found`,
      );
    }

    const hrCost = this.hrCostRepository.create({
      ...createHRCostDto,
      employee,
    });

    return this.hrCostRepository.save(hrCost);
  }

  async findAll(): Promise<HRUnitCost[]> {
    return this.hrCostRepository.find({
      relations: ['employee'],
      order: { year: 'DESC', employee: { name: 'ASC' } },
    });
  }

  async findOne(id: number): Promise<HRUnitCost> {
    const hrCost = await this.hrCostRepository.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!hrCost) {
      throw new NotFoundException(`HR Cost with ID ${id} not found`);
    }

    return hrCost;
  }

  async findByEmployeeAndYear(
    employeeId: number,
    year: number,
  ): Promise<HRUnitCost> {
    const hrCost = await this.hrCostRepository.findOne({
      where: { employee: { id: employeeId }, year },
      relations: ['employee'],
    });

    if (!hrCost) {
      throw new NotFoundException(
        `HR Cost for employee ${employeeId} and year ${year} not found`,
      );
    }

    return hrCost;
  }

  async findByYear(year: number): Promise<HRUnitCost[]> {
    return this.hrCostRepository.find({
      where: { year },
      relations: ['employee'],
      order: { employee: { name: 'ASC' } },
    });
  }

  async update(
    id: number,
    updateHRCostDto: UpdateHRCostDto,
  ): Promise<HRUnitCost> {
    const hrCost = await this.findOne(id);

    if (
      updateHRCostDto.employeeId &&
      updateHRCostDto.employeeId !== hrCost.employee.id
    ) {
      const employee = await this.employeeRepository.findOne({
        where: { id: updateHRCostDto.employeeId },
      });

      if (!employee) {
        throw new NotFoundException(
          `Employee with ID ${updateHRCostDto.employeeId} not found`,
        );
      }

      hrCost.employee = employee;
    }

    Object.assign(hrCost, updateHRCostDto);

    return this.hrCostRepository.save(hrCost);
  }

  async remove(id: number): Promise<void> {
    const hrCost = await this.findOne(id);
    await this.hrCostRepository.softDelete(id);
  }

  async getMonthlyTotal(year: number, month: number): Promise<number> {
    const hrCosts = await this.findByYear(year);
    return hrCosts.reduce((total, hrCost) => total + hrCost.monthlyCost, 0);
  }

  async getTotalBonus(year: number): Promise<number> {
    const hrCosts = await this.findByYear(year);
    return hrCosts.reduce((total, hrCost) => total + hrCost.bonus, 0);
  }

  async calculateTotalLaborCost(year: number): Promise<{
    totalAnnualSalary: number;
    totalSocialInsurance: number;
    totalRetirementPension: number;
    totalCompanyBurden: number;
    totalMonthlyCost: number;
    totalBonus: number;
    totalFixedLaborCost: number;
  }> {
    const hrCosts = await this.findByYear(year);

    return {
      totalAnnualSalary: hrCosts.reduce((sum, hr) => sum + hr.annualSalary, 0),
      totalSocialInsurance: hrCosts.reduce(
        (sum, hr) => sum + hr.socialInsurance,
        0,
      ),
      totalRetirementPension: hrCosts.reduce(
        (sum, hr) => sum + hr.retirementPension,
        0,
      ),
      totalCompanyBurden: hrCosts.reduce(
        (sum, hr) => sum + hr.companyBurden,
        0,
      ),
      totalMonthlyCost: hrCosts.reduce((sum, hr) => sum + hr.monthlyCost, 0),
      totalBonus: hrCosts.reduce((sum, hr) => sum + hr.bonus, 0),
      totalFixedLaborCost: hrCosts.reduce(
        (sum, hr) => sum + hr.fixedLaborCost,
        0,
      ),
    };
  }
}
