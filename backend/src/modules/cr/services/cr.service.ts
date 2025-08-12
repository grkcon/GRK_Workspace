import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../../entities/employee.entity';
import { InternalStaff } from '../../../entities/internal-staff.entity';
import { Project } from '../../../entities/project.entity';
import { ProjectPPE } from '../../../entities/project-ppe.entity';
import { EmployeeCRDto, CRDetailDto } from '../dto/employee-cr.dto';

@Injectable()
export class CRService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(InternalStaff)
    private readonly internalStaffRepository: Repository<InternalStaff>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectPPE)
    private readonly projectPPERepository: Repository<ProjectPPE>,
  ) {}

  async getEmployeeCRList(): Promise<EmployeeCRDto[]> {
    const employees = await this.employeeRepository.find({
      relations: ['projectAssignments', 'projectAssignments.project', 'projectAssignments.project.projectPPE'],
    });

    const employeeCRList: EmployeeCRDto[] = [];

    for (const employee of employees) {
      let totalCR = 0;

      // 각 직원이 참여한 프로젝트의 CR 계산
      if (employee.projectAssignments && employee.projectAssignments.length > 0) {
        for (const assignment of employee.projectAssignments) {
          const project = assignment.project;
          const projectPPE = project.projectPPE;

          if (projectPPE && projectPPE.revenue > 0) {
            // 프로젝트 전체 인건비 계산
            const totalLaborCost = await this.getTotalLaborCostForProject(project.id);
            
            if (totalLaborCost > 0) {
              // 개별 직원의 투입원가 비중 계산
              const costWeight = assignment.totalCost / totalLaborCost;
              // CR = 프로젝트 매출 * 투입원가 비중
              const cr = projectPPE.revenue * costWeight;
              totalCR += cr;
            }
          }
        }
      }

      employeeCRList.push({
        id: employee.id,
        emp_no: employee.empNo,
        name: employee.name,
        department: employee.department,
        position: employee.position,
        totalCR,
      });
    }

    return employeeCRList.sort((a, b) => b.totalCR - a.totalCR);
  }

  async getEmployeeCRDetails(employeeId: number): Promise<CRDetailDto[]> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['projectAssignments', 'projectAssignments.project', 'projectAssignments.project.projectPPE'],
    });

    if (!employee) {
      return [];
    }

    const crDetails: CRDetailDto[] = [];

    if (employee.projectAssignments && employee.projectAssignments.length > 0) {
      for (const assignment of employee.projectAssignments) {
        const project = assignment.project;
        const projectPPE = project.projectPPE;

        if (projectPPE && projectPPE.revenue > 0) {
          // 프로젝트 전체 인건비 계산
          const totalLaborCost = await this.getTotalLaborCostForProject(project.id);
          
          if (totalLaborCost > 0) {
            // 개별 직원의 투입원가 비중 계산
            const costWeight = assignment.totalCost / totalLaborCost;
            // CR = 프로젝트 매출 * 투입원가 비중
            const cr = projectPPE.revenue * costWeight;

            crDetails.push({
              employeeId: employee.id,
              projectName: project.name,
              projectRevenue: projectPPE.revenue,
              costWeight,
              cr,
            });
          }
        }
      }
    }

    return crDetails.sort((a, b) => b.cr - a.cr);
  }

  private async getTotalLaborCostForProject(projectId: number): Promise<number> {
    const internalStaff = await this.internalStaffRepository.find({
      where: { project: { id: projectId } },
    });

    return internalStaff.reduce((total, staff) => total + staff.totalCost, 0);
  }
}