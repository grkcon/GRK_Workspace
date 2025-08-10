import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectPPE } from '../../../entities/project-ppe.entity';
import { Project } from '../../../entities/project.entity';
import { OpexItem, OpexType, OpexRelationshipType } from '../../../entities/opex-item.entity';
import { CreatePPEDto } from '../dto/create-ppe.dto';
import { UpdatePPEDto } from '../dto/update-ppe.dto';

@Injectable()
export class PPEService {
  constructor(
    @InjectRepository(ProjectPPE)
    private ppeRepository: Repository<ProjectPPE>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(OpexItem)
    private opexItemRepository: Repository<OpexItem>,
  ) {}

  // 모든 PPE 조회 (프로젝트 정보 포함)
  async findAll() {
    return await this.ppeRepository.find({
      relations: [
        'project',
        'project.projectClient',
        'project.projectPayment',
        'project.internalStaff',
        'project.externalStaff',
        'indirectOpex',
        'directOpex',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // 특정 PPE 조회
  async findOne(id: number) {
    const ppe = await this.ppeRepository.findOne({
      where: { id },
      relations: [
        'project',
        'project.projectClient',
        'project.projectPayment',
        'project.internalStaff',
        'project.externalStaff',
        'indirectOpex',
        'directOpex',
      ],
    });

    if (!ppe) {
      throw new NotFoundException(`PPE with ID ${id} not found`);
    }

    return ppe;
  }

  // 프로젝트별 PPE 조회
  async findByProjectId(projectId: number) {
    const ppe = await this.ppeRepository.findOne({
      where: { project: { id: projectId } },
      relations: [
        'project',
        'project.projectClient',
        'project.projectPayment',
        'project.internalStaff',
        'project.externalStaff',
        'indirectOpex',
        'directOpex',
      ],
    });

    if (!ppe) {
      throw new NotFoundException(`PPE for project ID ${projectId} not found`);
    }

    return ppe;
  }

  // PPE 생성
  async create(projectId: number, createPPEDto: CreatePPEDto) {
    // 프로젝트 존재 확인
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // 이미 해당 프로젝트의 PPE가 있는지 확인
    const existingPPE = await this.ppeRepository.findOne({
      where: { project: { id: projectId } },
    });

    if (existingPPE) {
      // 이미 존재한다면 업데이트 로직으로 처리
      return this.update(existingPPE.id, createPPEDto);
    }

    // PPE 계산 수행
    const calculatedData = this.calculatePPE(createPPEDto);

    // PPE 생성
    const ppe = this.ppeRepository.create({
      ...calculatedData,
      project,
    });

    const savedPPE = await this.ppeRepository.save(ppe);

    // OPEX 항목들 처리
    if (createPPEDto.indirectOpex && createPPEDto.indirectOpex.length > 0) {
      const indirectItems = createPPEDto.indirectOpex.map((item) =>
        this.opexItemRepository.create({
          category: item.category || '',
          amount: item.amount || 0,
          note: item.note || '',
          type: OpexType.INDIRECT,
          relationshipType: OpexRelationshipType.PPE_INDIRECT,
          projectPPEIndirect: savedPPE,
        }),
      );
      await this.opexItemRepository.save(indirectItems);
    }

    if (createPPEDto.directOpex && createPPEDto.directOpex.length > 0) {
      const directItems = createPPEDto.directOpex.map((item) =>
        this.opexItemRepository.create({
          category: item.category || '',
          amount: item.amount || 0,
          note: item.note || '',
          type: OpexType.DIRECT,
          relationshipType: OpexRelationshipType.PPE_DIRECT,
          projectPPEDirect: savedPPE,
        }),
      );
      await this.opexItemRepository.save(directItems);
    }

    // 전체 데이터와 함께 반환
    return this.findOne(savedPPE.id);
  }

  // PPE 업데이트
  async update(id: number, updatePPEDto: UpdatePPEDto) {
    const ppe = await this.findOne(id);

    // 업데이트된 데이터로 계산 수행
    const updatedData = { ...ppe, ...updatePPEDto };
    const calculatedData = this.calculatePPE(updatedData);

    // PPE 업데이트
    Object.assign(ppe, calculatedData);
    const savedPPE = await this.ppeRepository.save(ppe);

    // OPEX 항목들 업데이트 (기존 항목 삭제 후 재생성)
    if (updatePPEDto.indirectOpex !== undefined) {
      // 기존 indirect OPEX 삭제
      await this.opexItemRepository.delete({ projectPPEIndirect: { id } });

      // 새로운 indirect OPEX 생성
      if (updatePPEDto.indirectOpex.length > 0) {
        const indirectItems = updatePPEDto.indirectOpex.map((item) =>
          this.opexItemRepository.create({
            category: item.category || '',
            amount: item.amount || 0,
            note: item.note || '',
            type: OpexType.INDIRECT,
            relationshipType: OpexRelationshipType.PPE_INDIRECT,
            projectPPEIndirect: savedPPE,
          }),
        );
        await this.opexItemRepository.save(indirectItems);
      }
    }

    if (updatePPEDto.directOpex !== undefined) {
      // 기존 direct OPEX 삭제
      await this.opexItemRepository.delete({ projectPPEDirect: { id } });

      // 새로운 direct OPEX 생성
      if (updatePPEDto.directOpex.length > 0) {
        const directItems = updatePPEDto.directOpex.map((item) =>
          this.opexItemRepository.create({
            category: item.category || '',
            amount: item.amount || 0,
            note: item.note || '',
            type: OpexType.DIRECT,
            relationshipType: OpexRelationshipType.PPE_DIRECT,
            projectPPEDirect: savedPPE,
          }),
        );
        await this.opexItemRepository.save(directItems);
      }
    }

    // 전체 데이터와 함께 반환
    return this.findOne(savedPPE.id);
  }

  // PPE 삭제
  async remove(id: number) {
    const ppe = await this.findOne(id);
    await this.ppeRepository.remove(ppe);
    return { message: 'PPE deleted successfully' };
  }

  // PPE 계산 로직
  private calculatePPE(data: Partial<CreatePPEDto>) {
    const {
      revenue = 0,
      laborCost = 0,
      outsourcingCost = 0,
      opexCost = 0,
    } = data;

    // Gross Income = Revenue - Labor Cost - Outsourcing Cost
    const grossIncome = revenue - laborCost - outsourcingCost;
    const grossIncomeRate = revenue > 0 ? (grossIncome / revenue) * 100 : 0;

    // Operation Income = Gross Income - OPEX Cost
    const operationIncome = grossIncome - opexCost;
    const operationIncomeRate =
      revenue > 0 ? (operationIncome / revenue) * 100 : 0;

    // Profit = Operation Income * 0.8 (세후 80%, 세율 20%)
    const profit = operationIncome * 0.8;
    const profitRate = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      revenue: Number(revenue),
      laborCost: Number(laborCost),
      outsourcingCost: Number(outsourcingCost),
      opexCost: Number(opexCost),
      grossIncome: Number(grossIncome.toFixed(0)),
      grossIncomeRate: Number(grossIncomeRate.toFixed(2)),
      operationIncome: Number(operationIncome.toFixed(0)),
      operationIncomeRate: Number(operationIncomeRate.toFixed(2)),
      profit: Number(profit.toFixed(0)),
      profitRate: Number(profitRate.toFixed(2)),
    };
  }

  // 프로젝트별 PPE 요약 통계
  async getProjectSummary() {
    const result = await this.ppeRepository
      .createQueryBuilder('ppe')
      .select([
        'COUNT(ppe.id) as totalProjects',
        'SUM(ppe.revenue) as totalRevenue',
        'SUM(ppe.profit) as totalProfit',
        'AVG(ppe.profitRate) as avgProfitRate',
      ])
      .getRawOne();

    return {
      totalProjects: Number(result.totalProjects || 0),
      totalRevenue: Number(result.totalRevenue || 0),
      totalProfit: Number(result.totalProfit || 0),
      avgProfitRate: Number(Number(result.avgProfitRate || 0).toFixed(2)),
    };
  }
}
