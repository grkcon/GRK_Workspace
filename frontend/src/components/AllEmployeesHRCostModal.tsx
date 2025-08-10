import React, { useState, useEffect } from 'react';
import { employeeApi } from '../services/employeeApi';

interface AllEmployeesHRCostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmployeeHRCostData {
  employee: {
    id: number;
    name: string;
    position: string;
    department: string;
    monthlySalary: string;
  };
  hrCost: {
    annualSalary: number;
    monthlyLaborCost: number;
    opexAllocation: number;
    finalLaborCost: number;
    adjustedFinalLaborCost: number;
    roleMultiplier: number;
    bonusBaseDays: number;
    performanceBaseDays: number;
  };
}

const AllEmployeesHRCostModal: React.FC<AllEmployeesHRCostModalProps> = ({
  isOpen,
  onClose
}) => {
  const [hrCostData, setHRCostData] = useState<EmployeeHRCostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  // HR Cost 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadAllHRCostData();
    }
  }, [isOpen, selectedYear, selectedMonth]);

  const loadAllHRCostData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await employeeApi.getAllHRCostByMonth(selectedYear, selectedMonth);
      setHRCostData(data);
    } catch (err) {
      console.error('전체 HR Cost 데이터 로드 오류:', err);
      setError('HR Cost 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 합계 계산
  const getTotals = () => {
    return hrCostData.reduce((totals, item) => {
      return {
        totalMonthlyLabor: totals.totalMonthlyLabor + (item.hrCost.monthlyLaborCost || 0),
        totalOpexAllocation: totals.totalOpexAllocation + (item.hrCost.opexAllocation || 0),
        totalFinalLabor: totals.totalFinalLabor + (item.hrCost.adjustedFinalLaborCost || item.hrCost.finalLaborCost || 0),
      };
    }, {
      totalMonthlyLabor: 0,
      totalOpexAllocation: 0,
      totalFinalLabor: 0,
    });
  };

  const totals = getTotals();

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">HR Cost 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={loadAllHRCostData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                다시 시도
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                전체 직원 HR Cost 현황
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                총 {hrCostData.length}명의 직원 HR Cost 데이터
              </p>
            </div>
            {/* 연도-월 선택 컴포넌트 */}
            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* 합계 요약 */}
            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">합계 요약</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">총 월 인력비</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(totals.totalMonthlyLabor)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">총 OPEX 배분</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(totals.totalOpexAllocation)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">총 최종 인력원가</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(totals.totalFinalLabor)}</p>
                </div>
              </div>
            </div>

            {/* 직원 목록 테이블 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      직원명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      직급/부서
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      월급
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      조정비율
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      월 인력비
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OPEX 배분
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최종 인력원가
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      기준일수
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hrCostData.map((item, index) => (
                    <tr key={item.employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.employee.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{item.employee.position}</div>
                          <div className="text-xs text-gray-400">{item.employee.department}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(parseInt(item.employee.monthlySalary) || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.hrCost.roleMultiplier > 1 
                            ? 'bg-red-100 text-red-800' 
                            : item.hrCost.roleMultiplier < 1 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.hrCost.roleMultiplier}x
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(item.hrCost.monthlyLaborCost || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                        {formatCurrency(item.hrCost.opexAllocation || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                        {formatCurrency(item.hrCost.adjustedFinalLaborCost || item.hrCost.finalLaborCost || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                        <div className="text-xs">
                          <div>상여: {item.hrCost.bonusBaseDays || 0}일</div>
                          <div>성과: {item.hrCost.performanceBaseDays || 0}일</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllEmployeesHRCostModal;