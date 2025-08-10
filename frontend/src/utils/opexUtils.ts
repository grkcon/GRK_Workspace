import { MonthlyOpex, MonthlyOpexData, YearlyOpex, OpexType } from '../types/opex';

/**
 * MonthlyOpex (백엔드 형식)를 MonthlyOpexData (프론트엔드 형식)로 변환
 */
export const convertMonthlyOpexToData = (monthlyOpex: MonthlyOpex): MonthlyOpexData => {
  const indirect = monthlyOpex.opexItems.filter(item => item.type === OpexType.INDIRECT);
  const direct = monthlyOpex.opexItems.filter(item => item.type === OpexType.DIRECT);
  
  return {
    month: monthlyOpex.month,
    employeeCount: monthlyOpex.employeeCount,
    confirmed: monthlyOpex.confirmed,
    indirect,
    direct
  };
};

/**
 * YearlyOpex (백엔드 형식)를 MonthlyOpexData[] (프론트엔드 형식)로 변환
 */
export const convertYearlyOpexToData = (yearlyData: YearlyOpex): MonthlyOpexData[] => {
  const result: MonthlyOpexData[] = [];
  
  for (let month = 1; month <= 12; month++) {
    const monthData = yearlyData.months.find(m => m.month === month);
    
    if (monthData) {
      result.push(convertMonthlyOpexToData(monthData));
    } else {
      // 데이터가 없으면 빈 월 데이터 생성
      result.push({
        month,
        employeeCount: 0,
        confirmed: false,
        indirect: [],
        direct: []
      });
    }
  }
  
  return result;
};

/**
 * MonthlyOpexData (프론트엔드 형식)를 백엔드 저장 형식으로 변환
 * ID 기반 CRUD를 지원하는 UpdateMonthDataDto 형식으로 변환
 */
export const convertDataToUpdateFormat = (data: MonthlyOpexData) => {
  // 유효한 항목들만 필터링 (빈 데이터 제외)
  const validIndirect = (data.indirect || [])
    .filter(item => item.category?.trim() && item.amount > 0)
    .map(item => ({
      id: item.id > 0 ? item.id : undefined, // 양수 ID만 전송, 음수나 0은 새 항목으로 처리
      category: item.category.trim(),
      amount: item.amount,
      note: item.note?.trim() || '',
      type: item.type,
    }));

  const validDirect = (data.direct || [])
    .filter(item => item.category?.trim() && item.amount > 0)
    .map(item => ({
      id: item.id > 0 ? item.id : undefined, // 양수 ID만 전송, 음수나 0은 새 항목으로 처리
      category: item.category.trim(),
      amount: item.amount,
      note: item.note?.trim() || '',
      type: item.type,
    }));

  return {
    employeeCount: data.employeeCount, // 백엔드에서 동적 계산하므로 실제로는 사용되지 않음
    indirect: validIndirect,
    direct: validDirect,
    deleteIds: [] // 삭제는 별도로 즉시 처리되므로 빈 배열
  };
};

/**
 * 월별 데이터 배열에서 특정 월 데이터를 업데이트하는 유틸리티 함수
 */
export const updateMonthInArray = (
  monthlyData: MonthlyOpexData[], 
  updatedMonth: MonthlyOpexData
): MonthlyOpexData[] => {
  return monthlyData.map(data => 
    data.month === updatedMonth.month ? updatedMonth : data
  );
};