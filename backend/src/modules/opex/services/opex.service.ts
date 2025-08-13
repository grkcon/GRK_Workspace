import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  HttpException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, MoreThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  YearlyOpex,
  MonthlyOpex,
  OpexItem,
  OpexType,
  OpexRelationshipType,
} from '../../../entities';
import {
  CreateYearlyOpexDto,
  UpdateYearlyOpexDto,
  UpdateMonthDataDto,
} from '../dto';
import { EmployeeService } from '../../employee/services/employee.service';
import {
  OpexNotFoundException,
  OpexValidationException,
  OpexConflictException,
  OpexOperationException,
  OpexItemNotFoundException,
  OpexConfirmationException,
} from '../../../common/exceptions/opex.exception';

@Injectable()
export class OpexService {
  private readonly logger = new Logger(OpexService.name);

  constructor(
    @InjectRepository(YearlyOpex)
    private yearlyOpexRepository: Repository<YearlyOpex>,
    @InjectRepository(MonthlyOpex)
    private monthlyOpexRepository: Repository<MonthlyOpex>,
    @InjectRepository(OpexItem)
    private opexItemRepository: Repository<OpexItem>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => EmployeeService))
    private employeeService: EmployeeService,
  ) {}

  async create(createYearlyOpexDto: CreateYearlyOpexDto): Promise<YearlyOpex> {
    try {
      // 중복 연도 체크
      const existing = await this.yearlyOpexRepository.findOne({
        where: { year: createYearlyOpexDto.year },
      });

      if (existing) {
        throw new OpexConflictException(
          `OPEX data for year ${createYearlyOpexDto.year} already exists`,
        );
      }

      const yearlyOpex = this.yearlyOpexRepository.create({
        year: createYearlyOpexDto.year,
      });

      // 월별 OPEX 생성
      yearlyOpex.months = createYearlyOpexDto.months.map((monthDto) => {
        if (monthDto.month < 1 || monthDto.month > 12) {
          throw new OpexValidationException(
            `Invalid month: ${monthDto.month}. Month must be between 1 and 12`,
          );
        }

        const monthlyOpex = this.monthlyOpexRepository.create({
          month: monthDto.month,
          employeeCount: monthDto.employeeCount || 0,
          confirmed: monthDto.confirmed || false,
        });

        // OPEX 항목들 생성
        monthlyOpex.opexItems = monthDto.opexItems.map((itemDto) =>
          this.opexItemRepository.create(itemDto),
        );

        return monthlyOpex;
      });

      const saved = await this.yearlyOpexRepository.save(yearlyOpex);
      this.logger.log(`Created OPEX data for year ${createYearlyOpexDto.year}`);
      return saved;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new OpexOperationException('create yearly OPEX', error.message);
    }
  }

  async findAll(): Promise<YearlyOpex[]> {
    return this.yearlyOpexRepository.find({
      relations: ['months', 'months.opexItems'],
      order: { year: 'DESC' },
    });
  }

  async findOne(id: number): Promise<YearlyOpex> {
    const yearlyOpex = await this.yearlyOpexRepository.findOne({
      where: { id },
      relations: ['months', 'months.opexItems'],
    });

    if (!yearlyOpex) {
      throw new OpexNotFoundException();
    }

    return yearlyOpex;
  }

  async findByYear(year: number): Promise<YearlyOpex> {
    // 완전히 새로운 쿼리로 다시 조회 (캐시 및 연결 문제 우회)
    let yearlyOpex = await this.yearlyOpexRepository
      .createQueryBuilder('yearlyOpex')
      .leftJoinAndSelect('yearlyOpex.months', 'months')
      .leftJoinAndSelect('months.opexItems', 'opexItems')
      .where('yearlyOpex.year = :year', { year })
      .orderBy('months.month', 'ASC')
      .addOrderBy('opexItems.id', 'ASC')
      .getOne();

    if (!yearlyOpex) {
      yearlyOpex = await this.initializeYearlyOpex(year);
    } else if (!yearlyOpex.months || yearlyOpex.months.length < 12) {
      console.log(
        `[DEBUG] ${year}년 월별 데이터 부족 (현재: ${yearlyOpex.months?.length || 0}개월), 12개월로 보완`,
      );
      yearlyOpex = await this.ensureAllMonthsExist(yearlyOpex);
    }

    console.log(
      `[DEBUG] ${year}년 데이터 로드: ${yearlyOpex.months?.length || 0}개월, 총 OPEX 항목: ${yearlyOpex.months?.reduce((sum, m) => sum + (m.opexItems?.length || 0), 0) || 0}개`,
    );

    // 각 월별로 실제 재직 직원수를 동적으로 계산하여 업데이트
    if (yearlyOpex.months) {
      for (const month of yearlyOpex.months) {
        try {
          // 동적으로 해당 월의 실제 재직 직원수 계산
          const actualEmployeeCount =
            await this.employeeService.getActiveEmployeeCountByMonth(
              year,
              month.month,
            );
          const oldCount = month.employeeCount;

          // DB에 저장된 값을 실제 계산된 값으로 업데이트
          month.employeeCount = actualEmployeeCount;

          console.log(
            `[DEBUG] ${month.month}월 직원수 업데이트: ${oldCount}명 → ${actualEmployeeCount}명 (동적계산)`,
          );
        } catch (error) {
          console.error(`[ERROR] ${month.month}월 직원수 계산 실패:`, error);
          // 실패 시 기존값 유지
        }
      }
    }

    // 각 월별 상세 데이터 출력
    yearlyOpex.months?.forEach((month) => {
      if (month.opexItems && month.opexItems.length > 0) {
        const indirectTotal = month.opexItems
          .filter((item) => item.type === OpexType.INDIRECT)
          .reduce((sum, item) => sum + item.amount, 0);
        const directTotal = month.opexItems
          .filter((item) => item.type === OpexType.DIRECT)
          .reduce((sum, item) => sum + item.amount, 0);
        console.log(
          `[DEBUG] ${month.month}월: 직원수 ${month.employeeCount}명, Indirect ${indirectTotal}원, Direct ${directTotal}원, 확정여부: ${month.confirmed}`,
        );
      } else {
        console.log(
          `[DEBUG] ${month.month}월: 직원수 ${month.employeeCount}명, 데이터 없음, 확정여부: ${month.confirmed}`,
        );
      }
    });

    return yearlyOpex;
  }

  private async initializeYearlyOpex(year: number): Promise<YearlyOpex> {
    const yearlyOpex = this.yearlyOpexRepository.create({ year });

    // 1-12월 기본 데이터 생성
    yearlyOpex.months = [];
    for (let month = 1; month <= 12; month++) {
      const monthlyOpex = this.monthlyOpexRepository.create({
        month,
        employeeCount: 0,
        confirmed: false,
        yearlyOpex,
        opexItems: [],
      });
      yearlyOpex.months.push(monthlyOpex);
    }

    return this.yearlyOpexRepository.save(yearlyOpex);
  }

  private validateOpexItem(item: OpexItem): void {
    const relationships = [
      item.monthlyOpex,
      item.projectPPEIndirect,
      item.projectPPEDirect,
    ].filter((rel) => rel != null);

    if (relationships.length !== 1) {
      throw new Error(
        `OpexItem(ID: ${item.id || 'new'})은 정확히 하나의 관계만 가져야 합니다. 현재: ${relationships.length}개`,
      );
    }

    // relationshipType과 실제 관계 일치성 검증
    switch (item.relationshipType) {
      case OpexRelationshipType.MONTHLY_OPEX:
        if (!item.monthlyOpex) {
          throw new Error(
            `OpexItem(ID: ${item.id || 'new'})의 relationshipType이 MONTHLY_OPEX인데 monthlyOpex가 없습니다.`,
          );
        }
        break;
      case OpexRelationshipType.PPE_INDIRECT:
        if (!item.projectPPEIndirect) {
          throw new Error(
            `OpexItem(ID: ${item.id || 'new'})의 relationshipType이 PPE_INDIRECT인데 projectPPEIndirect가 없습니다.`,
          );
        }
        break;
      case OpexRelationshipType.PPE_DIRECT:
        if (!item.projectPPEDirect) {
          throw new Error(
            `OpexItem(ID: ${item.id || 'new'})의 relationshipType이 PPE_DIRECT인데 projectPPEDirect가 없습니다.`,
          );
        }
        break;
    }
  }

  private async ensureAllMonthsExist(
    yearlyOpex: YearlyOpex,
  ): Promise<YearlyOpex> {
    const existingMonths = yearlyOpex.months.map((m) => m.month);

    for (let month = 1; month <= 12; month++) {
      if (!existingMonths.includes(month)) {
        // DB에서 이미 존재하는지 다시 한번 확인 (동시성 문제 방지)
        const existingMonth = await this.monthlyOpexRepository.findOne({
          where: { yearlyOpex: { id: yearlyOpex.id }, month },
        });

        if (!existingMonth) {
          const monthlyOpex = this.monthlyOpexRepository.create({
            month,
            employeeCount: 0,
            confirmed: false,
            yearlyOpex,
            opexItems: [],
          });
          const savedMonth = await this.monthlyOpexRepository.save(monthlyOpex);
          yearlyOpex.months.push(savedMonth);
          console.log(
            `[DEBUG] ${month}월 MonthlyOpex 새로 생성: ID ${savedMonth.id}`,
          );
        } else {
          yearlyOpex.months.push(existingMonth);
          console.log(
            `[DEBUG] ${month}월 MonthlyOpex 기존 데이터 사용: ID ${existingMonth.id}`,
          );
        }
      }
    }

    // 월순으로 정렬
    yearlyOpex.months.sort((a, b) => a.month - b.month);

    // 모든 월에 대해 opexItems가 undefined인 경우 빈 배열로 초기화
    yearlyOpex.months.forEach((month) => {
      if (!month.opexItems) {
        month.opexItems = [];
      }
    });

    return yearlyOpex;
  }

  async update(
    id: number,
    updateYearlyOpexDto: UpdateYearlyOpexDto,
  ): Promise<YearlyOpex> {
    const yearlyOpex = await this.findOne(id);

    if (updateYearlyOpexDto.months) {
      // 기존 월별 데이터 삭제
      await this.monthlyOpexRepository.delete({ yearlyOpex: { id } });

      // 새로운 월별 데이터 생성
      yearlyOpex.months = updateYearlyOpexDto.months.map((monthDto) => {
        const monthlyOpex = this.monthlyOpexRepository.create({
          month: monthDto.month,
          employeeCount: monthDto.employeeCount || 0,
          confirmed: monthDto.confirmed || false,
          yearlyOpex,
        });

        monthlyOpex.opexItems = monthDto.opexItems.map((itemDto) =>
          this.opexItemRepository.create({
            ...itemDto,
            monthlyOpex,
          }),
        );

        return monthlyOpex;
      });
    }

    return this.yearlyOpexRepository.save(yearlyOpex);
  }

  async remove(id: number): Promise<void> {
    const yearlyOpex = await this.findOne(id);
    await this.yearlyOpexRepository.softDelete(id);
  }

  async getMonthlyTotal(
    year: number,
    month: number,
  ): Promise<{
    indirectTotal: number;
    directTotal: number;
    totalOpex: number;
  }> {
    const yearlyOpex = await this.findByYear(year);
    const monthlyOpex = yearlyOpex.months.find((m) => m.month === month);

    if (!monthlyOpex) {
      return { indirectTotal: 0, directTotal: 0, totalOpex: 0 };
    }

    const indirectTotal = monthlyOpex.opexItems
      .filter((item) => item.type === OpexType.INDIRECT)
      .reduce((sum, item) => sum + item.amount, 0);

    const directTotal = monthlyOpex.opexItems
      .filter((item) => item.type === OpexType.DIRECT)
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      indirectTotal,
      directTotal,
      totalOpex: indirectTotal + directTotal,
    };
  }

  async updateMonthData(
    year: number,
    month: number,
    data: any,
  ): Promise<MonthlyOpex> {

    try {
      const yearlyOpex = await this.findByYear(year);
      let monthlyOpex = yearlyOpex.months.find((m) => m.month === month);

      if (!monthlyOpex) {
        throw new NotFoundException(
          `Monthly OPEX for ${year}/${month} not found`,
        );
      }


      // 프론트엔드에서 전송된 모든 항목 수집
      const incomingItems = [
        ...(data.indirect || []).map((item) => ({
          ...item,
          type: OpexType.INDIRECT,
        })),
        ...(data.direct || []).map((item) => ({
          ...item,
          type: OpexType.DIRECT,
        })),
      ].filter(
        (item) => item.category && item.category.trim() && item.amount > 0,
      );


      // 기존 항목 조회 후 삭제 (testDirectDelete와 동일한 패턴)
      const existingItems = await this.opexItemRepository.find({
        where: { monthlyOpex: { id: monthlyOpex.id } },
      });

      if (existingItems.length > 0) {
        const deleteResult = await this.opexItemRepository.delete(
          existingItems.map((item) => item.id),
        );
        console.log(
          `[DEBUG] 기존 항목 삭제 완료: ${deleteResult.affected || 0}개`,
        );
      } else {
      }

      // 직원수 업데이트
      monthlyOpex.employeeCount = data.employeeCount || 0;
      monthlyOpex = await this.monthlyOpexRepository.save(monthlyOpex);

      // 새 항목들 저장
      const savedItems: OpexItem[] = [];
      const indirectNo = 0;
      const directNo = 0;

      for (const incomingItem of incomingItems) {
        const newItem = this.opexItemRepository.create({
          category: incomingItem.category.trim(),
          amount: incomingItem.amount,
          note: incomingItem.note || '',
          type: incomingItem.type,
          relationshipType: OpexRelationshipType.MONTHLY_OPEX,
          monthlyOpex: monthlyOpex,
        });

        const savedItem = await this.opexItemRepository.save(newItem);
        savedItems.push(savedItem);
        console.log(
          `[DEBUG] 저장된 항목: ${savedItem.id} - ${savedItem.category}`,
        );
      }


      // 즉시 검증: 실제 DB에 저장된 항목 수 확인
      const finalVerifyCount = await this.opexItemRepository.count({
        where: { monthlyOpex: { id: monthlyOpex.id } },
      });

      // 직접 쿼리로 데이터 조회 (캐시 문제 우회)
      const finalItems = await this.opexItemRepository.find({
        where: { monthlyOpex: { id: monthlyOpex.id } },
        order: { id: 'ASC' },
      });

      finalItems.forEach((item) => {
        console.log(
          `[DEBUG] - ID: ${item.id}, Category: ${item.category}, Amount: ${item.amount}`,
        );
      });

      // MonthlyOpex 객체에 조회된 항목들 할당
      monthlyOpex.opexItems = finalItems;

      return monthlyOpex;
    } catch (error) {
      console.error(`[ERROR] updateMonthData 실패:`, error);
      throw error;
    }
  }

  /**
   * ID 기반 CRUD를 지원하는 새로운 월별 데이터 업데이트 메서드
   * - 양수 ID: 기존 항목 업데이트
   * - 음수 ID 또는 ID 없음: 새 항목 추가
   * - deleteIds에 포함된 항목: 삭제
   */
  async updateMonthDataV2(
    year: number,
    month: number,
    dto: UpdateMonthDataDto,
  ): Promise<MonthlyOpex> {
    console.log('updateMonthDataV2 called with:', {
      year,
      month,
      indirectCount: dto.indirect?.length || 0,
      directCount: dto.direct?.length || 0,
      deleteIds: dto.deleteIds || [],
      employeeCount: dto.employeeCount,
    });

    return await this.dataSource.transaction(async (manager: EntityManager) => {
      try {
        // 1. MonthlyOpex 조회 또는 생성
        let monthlyOpex = await manager.findOne(MonthlyOpex, {
          where: {
            yearlyOpex: { year },
            month,
          },
          relations: ['opexItems'],
        });

        if (!monthlyOpex) {
          // 해당 월 데이터가 없으면 YearlyOpex를 먼저 조회하고 MonthlyOpex 생성
          const yearlyOpex = await this.findByYear(year);
          monthlyOpex =
            yearlyOpex.months.find((m) => m.month === month) || null;

          if (!monthlyOpex) {
            throw new OpexNotFoundException(year, month);
          }
        }

        // 2. 직원수 동적 계산 및 변경 감지
        let employeeCountChanged = false;
        try {
          const actualEmployeeCount =
            await this.employeeService.getActiveEmployeeCountByMonth(
              year,
              month,
            );

          if (monthlyOpex.employeeCount !== actualEmployeeCount) {
            console.log(
              `[DEBUG] 직원수 변경: ${monthlyOpex.employeeCount}명 → ${actualEmployeeCount}명`,
            );
            monthlyOpex.employeeCount = actualEmployeeCount;
            employeeCountChanged = true;
          } else {
          }
        } catch (error) {
          console.error(`[ERROR] 직원수 계산 실패, 기존값 유지:`, error);
        }

        // 직원수가 변경된 경우에만 저장
        if (employeeCountChanged) {
          await manager.save(MonthlyOpex, monthlyOpex);
        }

        // 3. 삭제 처리 (양수 ID만 삭제)
        if (dto.deleteIds && dto.deleteIds.length > 0) {
          const validDeleteIds = dto.deleteIds.filter((id) => id > 0);
          if (validDeleteIds.length > 0) {
            await manager.delete(OpexItem, validDeleteIds);
          }
        }

        // 4. 기존 항목 조회 (업데이트용)
        const existingItems = await manager.find(OpexItem, {
          where: { monthlyOpex: { id: monthlyOpex.id } },
        });
        const existingItemsMap = new Map(
          existingItems.map((item) => [item.id, item]),
        );

        // 5. 추가/수정 처리
        const allItems = [
          ...(dto.indirect || []).map((item) => ({
            ...item,
            type: OpexType.INDIRECT,
          })),
          ...(dto.direct || []).map((item) => ({
            ...item,
            type: OpexType.DIRECT,
          })),
        ];


        // 6. 기존 항목별 최대 번호 확인 (새 항목 추가 시 사용)
        const existingIndirectItems = existingItems.filter(
          (item) => item.type === OpexType.INDIRECT,
        );
        const existingDirectItems = existingItems.filter(
          (item) => item.type === OpexType.DIRECT,
        );

        const itemsToSave: OpexItem[] = [];

        // 7. 각 항목 처리 (업데이트 또는 추가)
        for (const itemData of allItems) {
          // 빈 데이터 제외
          if (!itemData.category?.trim() || itemData.amount <= 0) {
            console.log(
              `[DEBUG] 빈 데이터 제외: ${itemData.category || 'empty'}`,
            );
            continue;
          }

          if (
            itemData.id &&
            itemData.id > 0 &&
            existingItemsMap.has(itemData.id)
          ) {
            // 기존 항목 업데이트 (변경 감지)
            const existingItem = existingItemsMap.get(itemData.id)!;
            const newCategory = itemData.category.trim();
            const newNote = itemData.note?.trim() || '';

            // 변경사항 확인
            const hasChanges =
              existingItem.category !== newCategory ||
              existingItem.amount !== itemData.amount ||
              existingItem.note !== newNote ||
              existingItem.type !== itemData.type;

            if (hasChanges) {
              existingItem.category = newCategory;
              existingItem.amount = itemData.amount;
              existingItem.note = newNote;
              existingItem.type = itemData.type;

              itemsToSave.push(existingItem);
              console.log(
                `[DEBUG] 업데이트: ID ${itemData.id} - ${itemData.category} (변경사항 있음)`,
              );
            } else {
              console.log(
                `[DEBUG] 변경 없음: ID ${itemData.id} - ${itemData.category} (저장 건너뜀)`,
              );
            }
          } else {
            // 새 항목 추가 (음수 ID이거나 ID가 없는 경우)
            const newItem = manager.create(OpexItem, {
              category: itemData.category.trim(),
              amount: itemData.amount,
              note: itemData.note?.trim() || '',
              type: itemData.type,
              relationshipType: OpexRelationshipType.MONTHLY_OPEX,
              monthlyOpex: monthlyOpex,
            });

            itemsToSave.push(newItem);
            console.log(
              `[DEBUG] 추가: ${itemData.category} (${itemData.type})`,
            );
          }
        }

        // 8. 저장 실행
        if (itemsToSave.length > 0) {
          await manager.save(OpexItem, itemsToSave);
        } else {
        }

        // 9. 전체 변경사항 요약
        const totalChanges =
          (employeeCountChanged ? 1 : 0) +
          itemsToSave.length +
          (dto.deleteIds?.length || 0);

        if (totalChanges === 0) {
        } else {
          console.log(
            `[DEBUG] 총 변경사항: 직원수 ${employeeCountChanged ? '변경' : '유지'}, 항목 ${itemsToSave.length}개 저장, ${dto.deleteIds?.length || 0}개 삭제`,
          );
        }

        // 10. 최종 데이터 조회 및 반환
        const updatedMonthlyOpex = await manager.findOne(MonthlyOpex, {
          where: { id: monthlyOpex.id },
          relations: ['opexItems'],
          order: { opexItems: { id: 'ASC' } },
        });

        if (!updatedMonthlyOpex) {
          throw new Error('Failed to retrieve updated monthly OPEX');
        }

        console.log(
          `[DEBUG] updateMonthDataV2 완료: 총 ${updatedMonthlyOpex.opexItems?.length || 0}개 항목`,
        );
        return updatedMonthlyOpex;
      } catch (error) {
        this.logger.error(
          `updateMonthDataV2 실패: ${error.message}`,
          error.stack,
        );
        if (error instanceof HttpException) {
          throw error;
        }
        throw new OpexOperationException('update month data', error.message);
      }
    });
  }

  async confirmMonth(year: number, month: number): Promise<any> {
    this.logger.log(`확정 프로세스 시작: ${year}년 ${month}월`);

    return await this.dataSource.transaction(async (manager: EntityManager) => {
      try {
        // 1. MonthlyOpex 조회 및 검증
        const monthlyOpex = await manager.findOne(MonthlyOpex, {
          where: {
            yearlyOpex: { year },
            month,
          },
          relations: ['opexItems', 'yearlyOpex'],
        });

        if (!monthlyOpex) {
          throw new OpexNotFoundException(year, month);
        }

        this.logger.log(
          `확정 전 ${month}월 OPEX 항목 수: ${monthlyOpex.opexItems?.length || 0}`,
        );

        // OPEX 항목이 없으면 확정 불가
        if (!monthlyOpex.opexItems || monthlyOpex.opexItems.length === 0) {
          throw new OpexConfirmationException(
            year,
            month,
            'No OPEX items to confirm',
          );
        }

        if (monthlyOpex.confirmed) {
          console.log(
            `[DEBUG] ${month}월은 이미 확정된 상태입니다. 재확정을 진행합니다.`,
          );
        }

        // 2. 해당 월을 확정 상태로 변경
        monthlyOpex.confirmed = true;
        await manager.save(MonthlyOpex, monthlyOpex);

        // 3. 확정된 월의 데이터를 이후 달에 반영 (트랜잭션 내에서)
        console.log(
          `[DEBUG] 확정된 월 ${month}의 OPEX 항목 수: ${monthlyOpex.opexItems?.length || 0}`,
        );
        console.log(
          `[DEBUG] 확정된 월 OPEX 항목 상세:`,
          monthlyOpex.opexItems?.map((item) => ({
            id: item.id,
            category: item.category,
            amount: item.amount,
            type: item.type,
          })),
        );

        await this.projectConfirmedDataToFutureMonthsInTransaction(
          manager,
          monthlyOpex,
          month,
        );

        this.logger.log(`트랜잭션 커밋 준비 완료`);

        // 트랜잭션 내에서 성공 응답 반환 (재조회 생략으로 성능 향상)
        return {
          success: true,
          confirmedMonth: monthlyOpex,
        };
      } catch (error) {
        this.logger.error(`확정 프로세스 실패: ${error.message}`, error.stack);
        if (error instanceof HttpException) {
          throw error;
        }
        throw new OpexOperationException('confirm month', error.message);
      }
    });
  }

  private async projectConfirmedDataToFutureMonthsInTransaction(
    manager: EntityManager,
    confirmedMonthlyOpex: MonthlyOpex,
    confirmedMonth: number,
  ): Promise<void> {
    console.log(
      `[DEBUG] 확정 월 ${confirmedMonth}의 데이터를 이후 달에 반영 시작 (트랜잭션, Batch 최적화)`,
    );

    console.log(
      `[DEBUG] ${confirmedMonth}월 OPEX 항목 수: ${confirmedMonthlyOpex.opexItems?.length || 0}`,
    );
    console.log(
      `[DEBUG] ${confirmedMonth}월 OPEX 항목 상세:`,
      confirmedMonthlyOpex.opexItems?.map((item) => ({
        category: item.category,
        amount: item.amount,
        type: item.type,
      })),
    );

    // 확정된 월 이후의 미확정 달들만 찾기
    const futureMonths = await manager.find(MonthlyOpex, {
      where: {
        yearlyOpex: { id: confirmedMonthlyOpex.yearlyOpex.id },
        month: MoreThan(confirmedMonth),
        confirmed: false, // 미확정 월만 대상
      },
    });

    console.log(
      `[DEBUG] 미래 월들: ${futureMonths.map((m) => m.month).join(', ')}`,
    );

    if (futureMonths.length === 0) {
      return;
    }

    // ✅ 성능 최적화 1: Batch 삭제
    const futureMonthIds = futureMonths.map((m) => m.id);
    console.log(
      `[DEBUG] Batch 삭제 시작: ${futureMonthIds.length}개 월의 기존 항목`,
    );

    const batchDeleteResult = await manager.delete(OpexItem, {
      monthlyOpex: { id: In(futureMonthIds) },
    });
    console.log(
      `[DEBUG] Batch 삭제 완료: ${batchDeleteResult.affected || 0}개 항목 삭제`,
    );

    // ✅ 성능 최적화 2: 모든 복사 항목을 한 번에 생성
    const allCopiedItems: OpexItem[] = [];

    for (const futureMonth of futureMonths) {
      // 직원수 동기화
      futureMonth.employeeCount = confirmedMonthlyOpex.employeeCount;

      // 확정된 월의 OPEX 항목들을 해당 미래 월로 복사
      for (const item of confirmedMonthlyOpex.opexItems) {
        const newItem = manager.create(OpexItem, {
          category: item.category,
          amount: item.amount,
          note: `${confirmedMonth}월 확정 데이터 반영`,
          type: item.type,
          relationshipType: OpexRelationshipType.MONTHLY_OPEX,
          monthlyOpex: futureMonth,
        });
        allCopiedItems.push(newItem);
      }
    }

    console.log(
      `[DEBUG] Batch 저장 시작: 총 ${allCopiedItems.length}개 항목 (${futureMonths.length}개 월)`,
    );

    // ✅ 성능 최적화 3: MonthlyOpex와 OpexItem을 Batch로 저장
    await manager.save(MonthlyOpex, futureMonths); // 직원수 업데이트
    const savedItems = await manager.save(OpexItem, allCopiedItems); // 모든 OPEX 항목 한번에 저장

    console.log(
      `[DEBUG] 월별 항목 수:`,
      futureMonths
        .map(
          (fm) =>
            `${fm.month}월: ${allCopiedItems.filter((item) => item.monthlyOpex?.id === fm.id).length}개`,
        )
        .join(', '),
    );

    console.log(
      `[DEBUG] 확정 월 ${confirmedMonth} 데이터 반영 완료 (트랜잭션, Batch 최적화)`,
    );
  }

  private async projectConfirmedDataToFutureMonths(
    confirmedMonthlyOpex: MonthlyOpex,
    confirmedMonth: number,
  ): Promise<void> {
    console.log(
      `[DEBUG] 확정 월 ${confirmedMonth}의 데이터를 이후 달에 반영 시작`,
    );

    console.log(
      `[DEBUG] ${confirmedMonth}월 OPEX 항목 수: ${confirmedMonthlyOpex.opexItems?.length || 0}`,
    );
    console.log(
      `[DEBUG] ${confirmedMonth}월 OPEX 항목 상세:`,
      confirmedMonthlyOpex.opexItems?.map((item) => ({
        category: item.category,
        amount: item.amount,
        type: item.type,
      })),
    );

    // 확정된 월 이후의 달들 찾기 (확정 여부 무관하게 모든 미래 월)
    const futureMonths = await this.monthlyOpexRepository.find({
      where: {
        yearlyOpex: { id: confirmedMonthlyOpex.yearlyOpex.id },
        month: MoreThan(confirmedMonth),
      },
    });

    console.log(
      `[DEBUG] 미래 월들: ${futureMonths.map((m) => m.month).join(', ')}`,
    );

    for (const futureMonth of futureMonths) {

      // 기존 OPEX 항목들 삭제 (쿼리 빌더 사용으로 더 확실하게)
      const deleteQuery = this.opexItemRepository
        .createQueryBuilder()
        .delete()
        .from(OpexItem)
        .where('monthlyOpexId = :monthlyOpexId', {
          monthlyOpexId: futureMonth.id,
        });

      const deleteResult = await deleteQuery.execute();
      console.log(
        `[DEBUG] ${futureMonth.month}월 기존 항목 ${deleteResult.affected || 0}개 삭제 완료`,
      );

      // 먼저 MonthlyOpex 저장 (직원수 업데이트)
      futureMonth.employeeCount = confirmedMonthlyOpex.employeeCount;
      await this.monthlyOpexRepository.save(futureMonth);

      // 확정된 월의 OPEX 항목들을 복사
      const copiedItems: OpexItem[] = [];
      for (const item of confirmedMonthlyOpex.opexItems) {
        const newItem = this.opexItemRepository.create({
          category: item.category,
          amount: item.amount,
          note: `${confirmedMonth}월 확정 데이터 반영`,
          type: item.type,
          monthlyOpex: futureMonth, // 이미 저장된 futureMonth 참조
        });
        copiedItems.push(newItem);
      }

      console.log(
        `[DEBUG] ${futureMonth.month}월에 복사할 항목 수: ${copiedItems.length}`,
      );
      console.log(
        `[DEBUG] ${futureMonth.month}월 MonthlyOpex ID: ${futureMonth.id}`,
      );

      const savedItems = await this.opexItemRepository.save(copiedItems);

      console.log(
        `[DEBUG] ${futureMonth.month}월에 ${savedItems.length}개 항목 저장 완료`,
      );
      console.log(
        `[DEBUG] ${futureMonth.month}월 저장된 항목 ID들:`,
        savedItems.map((item) => item.id),
      );

      // 저장 직후 실제 DB에서 확인
      const verifyCount = await this.opexItemRepository.count({
        where: { monthlyOpex: { id: futureMonth.id } },
      });
      console.log(
        `[DEBUG] ${futureMonth.month}월 DB 실제 저장 확인: ${verifyCount}개 항목`,
      );
    }

  }

  async getYearlySummary(year: number): Promise<{
    year: number;
    totalIndirectOpex: number;
    totalDirectOpex: number;
    totalOpex: number;
    monthlyBreakdown: Array<{
      month: number;
      indirectTotal: number;
      directTotal: number;
      total: number;
      confirmed: boolean;
    }>;
  }> {
    const yearlyOpex = await this.findByYear(year);

    let totalIndirectOpex = 0;
    let totalDirectOpex = 0;

    const monthlyBreakdown = yearlyOpex.months.map((monthlyOpex) => {
      const indirectTotal = monthlyOpex.opexItems
        .filter((item) => item.type === OpexType.INDIRECT)
        .reduce((sum, item) => sum + item.amount, 0);

      const directTotal = monthlyOpex.opexItems
        .filter((item) => item.type === OpexType.DIRECT)
        .reduce((sum, item) => sum + item.amount, 0);

      totalIndirectOpex += indirectTotal;
      totalDirectOpex += directTotal;

      return {
        month: monthlyOpex.month,
        indirectTotal,
        directTotal,
        total: indirectTotal + directTotal,
        confirmed: monthlyOpex.confirmed,
      };
    });

    return {
      year,
      totalIndirectOpex,
      totalDirectOpex,
      totalOpex: totalIndirectOpex + totalDirectOpex,
      monthlyBreakdown,
    };
  }

  // 임시 디버깅용 메서드 - 새로운 쿼리 사용
  async getOpexItemsForDebug(year: number) {
    const yearlyOpex = await this.yearlyOpexRepository
      .createQueryBuilder('yearlyOpex')
      .leftJoinAndSelect('yearlyOpex.months', 'months')
      .leftJoinAndSelect('months.opexItems', 'opexItems')
      .where('yearlyOpex.year = :year', { year })
      .orderBy('months.month', 'ASC')
      .addOrderBy('opexItems.id', 'ASC')
      .getOne();

    if (!yearlyOpex) {
      return { year, message: 'No data found', totalItems: 0 };
    }

    const result = {
      year,
      totalMonths: yearlyOpex.months.length,
      totalItems: yearlyOpex.months.reduce(
        (sum, m) => sum + (m.opexItems?.length || 0),
        0,
      ),
      monthlyDetails: yearlyOpex.months.map((month) => ({
        month: month.month,
        confirmed: month.confirmed,
        employeeCount: month.employeeCount,
        itemCount: month.opexItems?.length || 0,
        items:
          month.opexItems?.map((item) => ({
            id: item.id,
            category: item.category,
            amount: item.amount,
            type: item.type,
            note: item.note,
          })) || [],
      })),
    };

    console.log(
      `[DEBUG] 디버깅 API 호출: ${year}년도 총 ${result.totalItems}개 OPEX 항목`,
    );

    return result;
  }

  // 미래 월 조회 테스트용 메서드
  async getFutureMonthsForDebug(year: number, month: number) {
    // 1. 먼저 확정할 월 조회
    const monthlyOpex = await this.monthlyOpexRepository.findOne({
      where: {
        yearlyOpex: { year },
        month,
      },
      relations: ['opexItems', 'yearlyOpex'],
    });

    if (!monthlyOpex) {
      return { error: `Monthly OPEX for ${year}/${month} not found` };
    }

    // 2. 미래 월들 조회 (확정 로직과 동일)
    const futureMonths = await this.monthlyOpexRepository.find({
      where: {
        yearlyOpex: { id: monthlyOpex.yearlyOpex.id },
        month: MoreThan(month),
        confirmed: false,
      },
    });

    return {
      confirmedMonth: {
        month: monthlyOpex.month,
        confirmed: monthlyOpex.confirmed,
        itemCount: monthlyOpex.opexItems?.length || 0,
        yearlyOpexId: monthlyOpex.yearlyOpex.id,
      },
      futureMonths: futureMonths.map((fm) => ({
        month: fm.month,
        confirmed: fm.confirmed,
        id: fm.id,
      })),
      futureMonthCount: futureMonths.length,
    };
  }

  // confirmed 상태 리셋용 메서드
  async resetConfirmedStatus(year: number, month: number) {
    const monthlyOpex = await this.monthlyOpexRepository.findOne({
      where: {
        yearlyOpex: { year },
        month,
      },
    });

    if (!monthlyOpex) {
      return { error: `Monthly OPEX for ${year}/${month} not found` };
    }

    const previousStatus = monthlyOpex.confirmed;
    monthlyOpex.confirmed = false;

    await this.monthlyOpexRepository.save(monthlyOpex);

    console.log(
      `[DEBUG] ${year}년 ${month}월 confirmed 상태: ${previousStatus} → false`,
    );

    return {
      success: true,
      message: `${year}년 ${month}월 confirmed 상태를 ${previousStatus} → false로 리셋했습니다.`,
      previousStatus,
      currentStatus: false,
    };
  }

  // 원시 SQL로 실제 DB 데이터 확인
  async getRawItemCount(year: number) {
    const query = `
      SELECT 
        m.month,
        m.confirmed,
        COUNT(oi.id) as item_count
      FROM yearly_opex yo
      LEFT JOIN monthly_opex m ON yo.id = m.yearly_opex_id 
      LEFT JOIN opex_items oi ON m.id = oi.monthly_opex_id
      WHERE yo.year = $1 
      GROUP BY m.id, m.month, m.confirmed
      ORDER BY m.month
    `;

    try {
      const result = await this.dataSource.query(query, [year]);

      const totalItems = result.reduce(
        (sum, row) => sum + parseInt(row.item_count),
        0,
      );

      return {
        year,
        totalItems,
        monthlyBreakdown: result.map((row) => ({
          month: row.month,
          confirmed: row.confirmed,
          itemCount: parseInt(row.item_count),
        })),
      };
    } catch (error) {
      console.error('[DEBUG] SQL 쿼리 오류:', error);
      return { error: error.message, year };
    }
  }

  // 테스트용 월별 데이터 생성 메서드
  async createTestMonthData(year: number, month: number) {

    // 먼저 해당 연도 YearlyOpex가 있는지 확인
    let yearlyOpex = await this.yearlyOpexRepository.findOne({
      where: { year },
      relations: ['months'],
    });

    if (!yearlyOpex) {
      yearlyOpex = await this.initializeYearlyOpex(year);
    }

    // 해당 월의 MonthlyOpex 찾기
    let monthlyOpex = await this.monthlyOpexRepository.findOne({
      where: {
        yearlyOpex: { year },
        month,
      },
      relations: ['opexItems', 'yearlyOpex'],
    });

    if (!monthlyOpex) {
      monthlyOpex = this.monthlyOpexRepository.create({
        month,
        employeeCount: 10,
        confirmed: false,
        yearlyOpex,
        opexItems: [],
      });
      monthlyOpex = await this.monthlyOpexRepository.save(monthlyOpex);
    }

    // 기존 OPEX 항목들 삭제
    if (monthlyOpex.opexItems && monthlyOpex.opexItems.length > 0) {
      await this.opexItemRepository.delete({
        monthlyOpex: { id: monthlyOpex.id },
      });
    }

    // 테스트 데이터 생성
    const testItems: OpexItem[] = [];

    // Indirect OPEX 테스트 항목들
    const indirectTestData = [
      { category: '사무용품', amount: 500000 },
      { category: '통신비', amount: 300000 },
      { category: '전기세', amount: 200000 },
    ];

    for (const itemData of indirectTestData) {
      const opexItem = this.opexItemRepository.create({
        category: itemData.category,
        amount: itemData.amount,
        note: `${month}월 테스트 데이터`,
        type: OpexType.INDIRECT,
        relationshipType: OpexRelationshipType.MONTHLY_OPEX,
        monthlyOpex,
      });
      testItems.push(opexItem);
    }

    // Direct OPEX 테스트 항목들
    const directTestData = [
      { category: '프로젝트 A 비용', amount: 1000000 },
      { category: '프로젝트 B 비용', amount: 800000 },
    ];

    for (const itemData of directTestData) {
      const opexItem = this.opexItemRepository.create({
        category: itemData.category,
        amount: itemData.amount,
        note: `${month}월 테스트 데이터`,
        type: OpexType.DIRECT,
        relationshipType: OpexRelationshipType.MONTHLY_OPEX,
        monthlyOpex,
      });
      testItems.push(opexItem);
    }

    // 테스트 항목들 저장
    const savedItems = await this.opexItemRepository.save(testItems);
    console.log(
      `[DEBUG] ${month}월에 ${savedItems.length}개 테스트 항목 저장 완료`,
    );

    // 직원수 설정
    monthlyOpex.employeeCount = 10;
    monthlyOpex.confirmed = false;
    await this.monthlyOpexRepository.save(monthlyOpex);

    // 생성된 데이터 확인
    const updatedMonthlyOpex = await this.monthlyOpexRepository.findOne({
      where: {
        yearlyOpex: { year },
        month,
      },
      relations: ['opexItems'],
    });

    if (!updatedMonthlyOpex) {
      throw new Error(
        `테스트 데이터 생성 후 ${year}년 ${month}월 데이터를 찾을 수 없습니다.`,
      );
    }

    const indirectTotal = updatedMonthlyOpex.opexItems
      .filter((item) => item.type === OpexType.INDIRECT)
      .reduce((sum, item) => sum + item.amount, 0);

    const directTotal = updatedMonthlyOpex.opexItems
      .filter((item) => item.type === OpexType.DIRECT)
      .reduce((sum, item) => sum + item.amount, 0);

    console.log(
      `[DEBUG] - Indirect: ${indirectTotal}원 (${updatedMonthlyOpex.opexItems.filter((item) => item.type === OpexType.INDIRECT).length}개 항목)`,
    );
    console.log(
      `[DEBUG] - Direct: ${directTotal}원 (${updatedMonthlyOpex.opexItems.filter((item) => item.type === OpexType.DIRECT).length}개 항목)`,
    );
    console.log(
      `[DEBUG] - 총 ${updatedMonthlyOpex.opexItems.length}개 항목, 직원수: ${updatedMonthlyOpex.employeeCount}명`,
    );

    return {
      success: true,
      message: `${year}년 ${month}월 테스트 데이터 생성 완료`,
      data: {
        month: updatedMonthlyOpex.month,
        employeeCount: updatedMonthlyOpex.employeeCount,
        confirmed: updatedMonthlyOpex.confirmed,
        itemCount: updatedMonthlyOpex.opexItems.length,
        indirectTotal,
        directTotal,
        totalAmount: indirectTotal + directTotal,
        items: updatedMonthlyOpex.opexItems.map((item) => ({
          category: item.category,
          amount: item.amount,
          type: item.type,
          note: item.note,
        })),
      },
    };
  }

  @Cron('0 0 1 1 *')
  async createNewYearData() {
    const currentYear = new Date().getFullYear();
    console.log(
      `[SCHEDULER] ${currentYear}년 1월 1일 - ${currentYear}년 OPEX 데이터 자동 생성 시작`,
    );

    try {
      const existingYearlyOpex = await this.yearlyOpexRepository.findOne({
        where: { year: currentYear },
      });

      if (!existingYearlyOpex) {
        const newYearlyOpex = await this.initializeYearlyOpex(currentYear);
        console.log(
          `[SCHEDULER] ${currentYear}년 OPEX 데이터 자동 생성 완료 - ID: ${newYearlyOpex.id}`,
        );
      } else {
        console.log(
          `[SCHEDULER] ${currentYear}년 OPEX 데이터가 이미 존재합니다.`,
        );
      }
    } catch (error) {
      console.error(
        `[SCHEDULER] ${currentYear}년 OPEX 데이터 생성 실패:`,
        error,
      );
    }
  }

  async getAvailableYears(): Promise<number[]> {
    const years = await this.yearlyOpexRepository
      .createQueryBuilder('yearlyOpex')
      .select('yearlyOpex.year')
      .orderBy('yearlyOpex.year', 'DESC')
      .getMany();

    return years.map((y) => y.year);
  }

  // 간단한 저장 테스트용 메서드
  async testSimpleSave(year: number, month: number): Promise<any> {

    const yearlyOpex = await this.findByYear(year);
    const monthlyOpex = yearlyOpex.months.find((m) => m.month === month);

    if (!monthlyOpex) {
      return { error: `Monthly OPEX for ${year}/${month} not found` };
    }

    // 기존 항목 삭제
    await this.opexItemRepository.delete({
      monthlyOpex: { id: monthlyOpex.id },
    });

    // 간단한 새 항목 생성
    const newItem = this.opexItemRepository.create({
      category: 'Simple Test Item',
      amount: 100000,
      note: 'test',
      type: OpexType.INDIRECT,
      relationshipType: OpexRelationshipType.MONTHLY_OPEX,
      monthlyOpex: monthlyOpex,
    });

    try {
      const savedItem = await this.opexItemRepository.save(newItem);

      return {
        success: true,
        savedItem: {
          id: savedItem.id,
          category: savedItem.category,
          amount: savedItem.amount,
        },
      };
    } catch (error) {
      console.error(`[DEBUG] 간단한 저장 실패:`, error);
      return { error: error.message };
    }
  }

  // 직접 삭제 테스트용 메서드
  async testDirectDelete(year: number, month: number): Promise<any> {

    const monthlyOpex = await this.monthlyOpexRepository.findOne({
      where: {
        yearlyOpex: { year },
        month,
      },
      relations: ['opexItems'],
    });

    if (!monthlyOpex || !monthlyOpex.opexItems) {
      return { error: `No items found for ${year}/${month}` };
    }

    const itemsToDelete = monthlyOpex.opexItems;
    console.log(
      `[DEBUG] 삭제할 항목들:`,
      itemsToDelete.map((item) => ({ id: item.id, category: item.category })),
    );

    if (itemsToDelete.length === 0) {
      return { message: 'No items to delete' };
    }

    // 직접 repository를 사용한 삭제
    const deleteResult = await this.opexItemRepository.delete(
      itemsToDelete.map((item) => item.id),
    );

    // 삭제 후 검증
    const remainingItems = await this.opexItemRepository.find({
      where: { monthlyOpex: { id: monthlyOpex.id } },
    });

    return {
      deletedCount: deleteResult.affected || 0,
      remainingCount: remainingItems.length,
      success: true,
    };
  }

  // 전체 OPEX 데이터 초기화 (디버그용) - 완전 삭제 버전
  async clearAllOpexData(year: number): Promise<any> {

    // 해당 연도의 YearlyOpex 완전 삭제 (cascade로 모든 관련 데이터 삭제)
    const deleteResult = await this.yearlyOpexRepository.delete({ year });
    console.log(
      `[DEBUG] ${year}년 YearlyOpex 삭제: ${deleteResult.affected}개`,
    );

    // 새로운 YearlyOpex 생성
    const newYearlyOpex = await this.initializeYearlyOpex(year);

    return {
      success: true,
      message: `${year}년 OPEX 데이터 완전 재생성 완료`,
      newYearlyOpexId: newYearlyOpex.id,
    };
  }

  /**
   * OpexItem 개별 관리 메서드들
   */
  async getOpexItem(id: number): Promise<OpexItem> {
    const item = await this.opexItemRepository.findOne({
      where: { id },
      relations: ['monthlyOpex', 'monthlyOpex.yearlyOpex'],
    });

    if (!item) {
      throw new OpexItemNotFoundException(id);
    }

    return item;
  }

  async updateOpexItem(id: number, data: Partial<OpexItem>): Promise<OpexItem> {
    const item = await this.getOpexItem(id);

    // 업데이트 가능한 필드만 수정
    if (data.category !== undefined) item.category = data.category;
    if (data.amount !== undefined) item.amount = data.amount;
    if (data.note !== undefined) item.note = data.note;
    if (data.type !== undefined) item.type = data.type;

    return await this.opexItemRepository.save(item);
  }

  async deleteOpexItem(
    id: number,
  ): Promise<{ success: boolean; message: string }> {
    const item = await this.getOpexItem(id);

    await this.opexItemRepository.delete(id);

    return {
      success: true,
      message: `OpexItem ${id} (${item.category}) deleted successfully`,
    };
  }

  /**
   * 월별 OpexItem 일괄 추가
   */
  async addOpexItems(
    year: number,
    month: number,
    items: Array<Partial<OpexItem>>,
  ): Promise<OpexItem[]> {
    const monthlyOpex = await this.monthlyOpexRepository.findOne({
      where: {
        yearlyOpex: { year },
        month,
      },
    });

    if (!monthlyOpex) {
      throw new NotFoundException(
        `Monthly OPEX for ${year}/${month} not found`,
      );
    }

    const newItems = items.map((item) =>
      this.opexItemRepository.create({
        ...item,
        monthlyOpex,
        relationshipType: OpexRelationshipType.MONTHLY_OPEX,
      }),
    );

    return await this.opexItemRepository.save(newItems);
  }
}
