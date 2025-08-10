import React, { useState, useEffect } from 'react';
import { MonthlyOpexData, YearlyOpex } from '../types/opex';
import { opexApi } from '../services/opexApi';
import OpexDetailModal from '../components/OpexDetailModal';
import { convertYearlyOpexToData, convertMonthlyOpexToData, convertDataToUpdateFormat, updateMonthInArray } from '../utils/opexUtils';

const OpexManagement: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMonthData, setSelectedMonthData] = useState<MonthlyOpexData | undefined>();
  const [monthlyOpexData, setMonthlyOpexData] = useState<MonthlyOpexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearlyOpex, setYearlyOpex] = useState<YearlyOpex | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    fetchOpexData();
  }, [selectedYear]);

  const fetchAvailableYears = async () => {
    try {
      const years = await opexApi.getAvailableYears();
      const currentYear = new Date().getFullYear();
      
      // Set을 사용하여 중복 제거 (number 타입 명시)
      const yearsSet = new Set<number>();
      
      // 1. 서버에서 받은 연도들 추가
      years.forEach(year => yearsSet.add(year));
      
      // 2. 현재 연도 추가
      yearsSet.add(currentYear);
      
      // 3. 다음 연도 추가 (계획용)
      yearsSet.add(currentYear + 1);
      
      // 4. 과거 2년 추가 (현재 연도는 이미 포함되므로 1년 전부터)
      yearsSet.add(currentYear - 1);
      yearsSet.add(currentYear - 2);
      
      const sortedYears = Array.from(yearsSet).sort((a: number, b: number) => b - a);
      
      console.log('Available years generated:', {
        serverYears: years,
        currentYear,
        finalYears: sortedYears
      });
      
      setAvailableYears(sortedYears);
      
      // 현재 선택된 연도가 없거나 리스트에 없으면 현재 연도로 설정
      if (!selectedYear || !sortedYears.includes(selectedYear)) {
        setSelectedYear(currentYear);
      }
    } catch (error) {
      console.error('Failed to fetch available years:', error);
      // 실패 시 기본값 사용
      const currentYear = new Date().getFullYear();
      const defaultYears = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];
      setAvailableYears(defaultYears);
      setSelectedYear(currentYear);
    }
  };

  const fetchOpexData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching OPEX data for year: ${selectedYear}`);
      const data = await opexApi.getByYear(selectedYear);
      setYearlyOpex(data);
      
      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const convertedData = convertYearlyOpexToData(data);
      setMonthlyOpexData(convertedData);
      
      console.log(`Successfully loaded OPEX data for ${selectedYear}:`, {
        totalMonths: data.months?.length || 0,
        hasData: convertedData.some(month => 
          month.indirect.length > 0 || month.direct.length > 0
        )
      });
      
      // 참고: 연도 목록은 fetchAvailableYears에서만 관리
      
    } catch (error: any) {
      console.error('Failed to fetch OPEX data:', error);
      setError(error?.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
      
      // 데이터가 없으면 빈 12개월 데이터 생성
      const emptyData = Array(12).fill(0).map((_, i) => ({
        month: i + 1,
        employeeCount: 0,
        confirmed: false,
        indirect: [],
        direct: []
      }));
      setMonthlyOpexData(emptyData);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const calculateAnnualTotal = () => {
    return monthlyOpexData.reduce((total, monthData) => {
      const indirectTotal = monthData.indirect.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const directTotal = monthData.direct.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return total + indirectTotal + directTotal;
    }, 0);
  };

  const openDetailModal = async (month: number) => {
    try {
      // 해당 월의 최신 데이터를 서버에서 재조회
      console.log(`[DEBUG] 재조회 중: ${selectedYear}년 ${month}월`);
      const yearlyData = await opexApi.getByYear(selectedYear);
      
      // 전체 데이터 업데이트
      const convertedData = convertYearlyOpexToData(yearlyData);
      setMonthlyOpexData(convertedData);
      
      // 해당 월의 데이터 찾아서 모달에 설정
      const monthData = convertedData.find(data => data.month === month);
      if (monthData) {
        console.log(`[DEBUG] 재조회 완료: ${month}월 데이터 로드됨`);
        setSelectedMonthData(monthData);
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error('월별 데이터 재조회 실패:', error);
      // 실패 시 기존 데이터로 모달 열기
      const monthData = monthlyOpexData.find(data => data.month === month);
      if (monthData) {
        setSelectedMonthData(monthData);
        setIsDetailModalOpen(true);
      }
    }
  };

  // 현재 월을 하이라이트하는 함수
  const isCurrentMonth = (year: number, month: number) => {
    const now = new Date();
    return year === now.getFullYear() && month === (now.getMonth() + 1);
  };

  // 연도 선택 시 자동으로 해당 연도의 현재 월 강조
  const getCurrentMonthForYear = (year: number) => {
    const now = new Date();
    if (year === now.getFullYear()) {
      return now.getMonth() + 1; // 1-12
    }
    return null; // 다른 연도면 현재 월 없음
  };

  const handleUpdateMonthData = async (updatedData: MonthlyOpexData): Promise<MonthlyOpexData> => {
    try {
      // 백엔드 저장 형식으로 변환 후 전송
      const dataToSend = convertDataToUpdateFormat(updatedData);
      const savedMonthlyOpex = await opexApi.updateMonthData(selectedYear, updatedData.month, dataToSend);
      
      // 백엔드 응답을 프론트엔드 형식으로 변환
      const convertedData = convertMonthlyOpexToData(savedMonthlyOpex);
      
      // 로컬 상태 업데이트
      setMonthlyOpexData(prev => updateMonthInArray(prev, convertedData));
      
      // 변환된 데이터 반환
      return convertedData;
    } catch (error) {
      console.error('Failed to update month data:', error);
      alert('데이터 저장에 실패했습니다. 다시 시도해 주세요.');
      throw error;
    }
  };

  const handleConfirmSuccess = async () => {
    // 확정 후에는 전체 데이터를 다시 로드
    // (확정으로 인해 여러 달의 데이터가 변경될 수 있기 때문)
    await fetchOpexData();
  };

  const getStatusStyle = (confirmed: boolean) => {
    return confirmed 
      ? 'px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md'
      : 'px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-md';
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <header className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">OPEX</h1>
            <p className="text-slate-500 mt-1">월별 운영 비용을 관리합니다.</p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="p-2 border border-slate-300 rounded-md text-sm"
            >
              {availableYears.map(year => {
                const currentYear = new Date().getFullYear();
                const isCurrentYear = year === currentYear;
                return (
                  <option key={year} value={year}>
                    {year}년{isCurrentYear ? ' (현재)' : ''}
                  </option>
                );
              })}
            </select>
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-right">
              <p className="text-sm text-slate-500">연간 예상 비용</p>
              <p className="text-2xl font-bold mt-1 text-indigo-600">
                {loading ? '로딩 중...' : formatCurrency(calculateAnnualTotal())} 원
              </p>
            </div>
          </div>
        </header>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-left">기준월</th>
                  <th className="px-6 py-3 font-medium text-right">Indirect opex</th>
                  <th className="px-6 py-3 font-medium text-right">direct opex</th>
                  <th className="px-6 py-3 font-medium text-right">OPEX 합계</th>
                  <th className="px-6 py-3 font-medium text-center">상태</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {monthlyOpexData.map((data) => {
                  const indirectTotal = data.indirect.reduce((sum, item) => sum + Number(item.amount || 0), 0);
                  const directTotal = data.direct.reduce((sum, item) => sum + Number(item.amount || 0), 0);
                  const total = indirectTotal + directTotal;
                  
                  const isCurrentMonthRow = isCurrentMonth(selectedYear, data.month);
                  
                  return (
                    <tr
                      key={data.month}
                      className={`border-t border-slate-200 hover:bg-slate-50 cursor-pointer ${
                        isCurrentMonthRow 
                          ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                          : ''
                      }`}
                      onClick={() => openDetailModal(data.month)}
                    >
                      <td className={`px-6 py-4 font-semibold ${
                        isCurrentMonthRow ? 'text-blue-700' : 'text-slate-900'
                      }`}>
                        {selectedYear}. {data.month}월
                        {isCurrentMonthRow && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                            현재
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">{formatCurrency(indirectTotal)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(directTotal)}</td>
                      <td className="px-6 py-4 text-right font-semibold">{formatCurrency(total)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={getStatusStyle(data.confirmed)}>
                          {data.confirmed ? '확정' : '계획'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <OpexDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        data={selectedMonthData}
        year={selectedYear}
        onUpdate={handleUpdateMonthData}
        onConfirmSuccess={handleConfirmSuccess}
      />
    </>
  );
};

export default OpexManagement;