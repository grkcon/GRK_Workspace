import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Project,
  ProjectClient,
  ProjectPayment,
  InternalStaff,
  ExternalStaff,
  ProjectPPE,
} from '../../../entities';
import { CreateProjectDto, UpdateProjectDto } from '../dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectClient)
    private projectClientRepository: Repository<ProjectClient>,
    @InjectRepository(ProjectPayment)
    private projectPaymentRepository: Repository<ProjectPayment>,
    @InjectRepository(InternalStaff)
    private internalStaffRepository: Repository<InternalStaff>,
    @InjectRepository(ExternalStaff)
    private externalStaffRepository: Repository<ExternalStaff>,
    @InjectRepository(ProjectPPE)
    private projectPPERepository: Repository<ProjectPPE>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      startDate: new Date(createProjectDto.startDate),
      endDate: new Date(createProjectDto.endDate),
    });

    // 프로젝트 클라이언트 정보
    if (createProjectDto.projectClient) {
      project.projectClient = this.projectClientRepository.create(
        createProjectDto.projectClient
      );
    }

    // 프로젝트 결제 정보
    if (createProjectDto.projectPayment) {
      project.projectPayment = this.projectPaymentRepository.create(
        createProjectDto.projectPayment
      );
    }

    // 내부 인력
    if (createProjectDto.internalStaff) {
      project.internalStaff = createProjectDto.internalStaff.map(staff =>
        this.internalStaffRepository.create({
          ...staff,
          startDate: new Date(staff.startDate),
          endDate: new Date(staff.endDate),
        })
      );
    }

    // 외부 인력
    if (createProjectDto.externalStaff) {
      project.externalStaff = createProjectDto.externalStaff.map(staff =>
        this.externalStaffRepository.create(staff)
      );
    }

    const savedProject = await this.projectRepository.save(project);

    // 초기 PPE 데이터 생성
    await this.createInitialPPE(savedProject);

    return savedProject;
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      relations: [
        'projectClient',
        'projectPayment',
        'internalStaff',
        'externalStaff',
        'projectPPE',
      ],
    });
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: [
        'projectClient',
        'projectPayment',
        'internalStaff',
        'externalStaff',
        'projectPPE',
        'projectPPE.indirectOpex',
        'projectPPE.directOpex',
      ],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    Object.assign(project, {
      ...updateProjectDto,
      startDate: updateProjectDto.startDate ? new Date(updateProjectDto.startDate) : project.startDate,
      endDate: updateProjectDto.endDate ? new Date(updateProjectDto.endDate) : project.endDate,
    });

    // 클라이언트 정보 업데이트
    if (updateProjectDto.projectClient) {
      if (project.projectClient) {
        Object.assign(project.projectClient, updateProjectDto.projectClient);
      } else {
        project.projectClient = this.projectClientRepository.create(
          updateProjectDto.projectClient
        );
      }
    }

    // 결제 정보 업데이트
    if (updateProjectDto.projectPayment) {
      if (project.projectPayment) {
        Object.assign(project.projectPayment, updateProjectDto.projectPayment);
      } else {
        project.projectPayment = this.projectPaymentRepository.create(
          updateProjectDto.projectPayment
        );
      }
    }

    return this.projectRepository.save(project);
  }

  async remove(id: number): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.softDelete(id);
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    return this.projectRepository.find({
      where: { status: status as any },
      relations: ['projectClient', 'projectPPE'],
    });
  }

  async getProjectsByPM(pm: string): Promise<Project[]> {
    return this.projectRepository.find({
      where: { pm },
      relations: ['projectClient', 'internalStaff', 'externalStaff'],
    });
  }

  private async createInitialPPE(project: Project): Promise<void> {
    const ppe = this.projectPPERepository.create({
      project,
      revenue: project.contractValue,
      laborCost: 0,
      outsourcingCost: 0,
      opexCost: project.contractValue * 0.1, // 운영비 10%
      grossIncome: 0,
      grossIncomeRate: 0,
      operationIncome: 0,
      operationIncomeRate: 0,
      profit: 0,
      profitRate: 0,
    });

    await this.projectPPERepository.save(ppe);
  }
}