import React, { useState, useEffect } from 'react';
import { Employee } from '../types/employee';
import { employeeApi } from '../services/employeeApi';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
}

interface HRCostData {
  // 기본 정보
  annualSalary: number;
  joinDate: string;
  bonusBaseDate: string;
  performanceBaseDate: string;

  // 계산된 급여 정보
  insuranceRetirement: number; // 4대보험/퇴직금
  companyBurden: number; // 회사 부담금액
  monthlyBurden: number; // 월 부담액

  // 상여금 정보
  bonusBaseDays: number; // 상여 기준일수
  bonusRate: number; // 상여금 비율
  performanceBaseDays: number; // PS 기준일수
  performanceRate: number; // PS 비율
  bonusAmount: number; // 상여금

  // 기타 비용
  welfareCost: number; // 복지비용
  fixedLaborCost: number; // 고정 인건비
  monthlyLaborCost: number; // 월 인력비

  // 배분 정보
  opexAllocation: number; // OPEX 배분
  eps: number; // EPS
  monthlyEps: number; // Monthly EPS
  ecm: number; // ECM
  finalLaborCost: number; // 최종 인력원가

  // 역할별 조정 비율
  roleMultiplier: number;
  adjustedMonthlyLaborCost: number;
  adjustedFinalLaborCost: number;

  // 계산 공식 설명
  calculationFormulas: {
    companyBurden: string;
    fixedLaborCost: string;
    monthlyLaborCost: string;
    insuranceRetirement: string;
  };
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee
}) => {
  const [hrCostData, setHRCostData] = useState<HRCostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  // HR Cost 데이터 로드
  useEffect(() => {
    if (isOpen && employee?.id) {
      loadHRCostData();
    }
  }, [isOpen, employee?.id, selectedYear, selectedMonth]);

  const loadHRCostData = async () => {
    if (!employee?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await employeeApi.getHRCostByMonth(employee.id, selectedYear, selectedMonth);
      setHRCostData(data);
    } catch (err) {
      console.error('HR Cost 데이터 로드 오류:', err);
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

  if (!isOpen || !employee) return null;

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
                onClick={loadHRCostData}
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

  if (!hrCostData) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {employee.name} HR Cost 상세
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {employee.position} · {employee.department}
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
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 기본 정보 섹션 */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      인력원가
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.finalLaborCost)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      입사일 (활동지원수)
                    </label>
                    <input
                      type="date"
                      value={hrCostData.joinDate?.split('T')[0] || ''}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상여금 기준일
                    </label>
                    <input
                      type="date"
                      value={hrCostData.bonusBaseDate?.split('T')[0] || ''}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      성과급 기준일
                    </label>
                    <input
                      type="date"
                      value={hrCostData.performanceBaseDate?.split('T')[0] || ''}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* 급여 정보 섹션 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">급여 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연봉
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.annualSalary)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm font-semibold border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      4대보험/퇴직금
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.insuranceRetirement)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      회사 부담금액
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.companyBurden)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm font-semibold text-blue-600 border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      월 부담액
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.monthlyBurden)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm font-semibold text-blue-600 border-gray-200 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* 상여금 정보 섹션 */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">상여금 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상여 기준일
                    </label>
                    <input
                      type="number"
                      value={hrCostData.bonusBaseDays}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상여금 비율
                    </label>
                    <input
                      type="text"
                      value={formatPercentage(hrCostData.bonusRate)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PS 기준일
                    </label>
                    <input
                      type="number"
                      value={hrCostData.performanceBaseDays}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PS 비율
                    </label>
                    <input
                      type="text"
                      value={formatPercentage(hrCostData.performanceRate)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상여금
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.bonusAmount)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm font-semibold text-green-600 border-gray-200 bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 비용 및 배분 정보 섹션 */}
            <div className="space-y-6">
              {/* 기타 비용 섹션 */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">비용 계산</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      복지비용
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.welfareCost)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      고정 인건비
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.fixedLaborCost)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm font-bold text-orange-600 border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      월 인력비
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.monthlyLaborCost)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm font-bold text-red-600 bg-red-50 border-red-200"
                    />
                  </div>
                </div>
              </div>

              {/* 배분 정보 섹션 */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">배분 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OPEX 배분
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.opexAllocation)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EPS
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.eps)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly EPS
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.monthlyEps)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ECM
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.ecm)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      최종 인력원가
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(hrCostData.adjustedFinalLaborCost || hrCostData.finalLaborCost)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-lg font-bold text-purple-600 bg-purple-100 border-purple-200"
                    />
                  </div>
                </div>
              </div>

              {/* 계산 공식 안내 */}
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">계산 공식</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>회사 부담금액:</span>
                    <span className="font-mono">{hrCostData.calculationFormulas.companyBurden}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>고정 인건비:</span>
                    <span className="font-mono">{hrCostData.calculationFormulas.fixedLaborCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>월 인력비:</span>
                    <span className="font-mono">{hrCostData.calculationFormulas.monthlyLaborCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>4대보험/퇴직금:</span>
                    <span className="font-mono">{hrCostData.calculationFormulas.insuranceRetirement}</span>
                  </div>
                  {hrCostData.roleMultiplier !== 1 && (
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span>역할별 조정비율:</span>
                      <span className="font-mono text-blue-600 font-semibold">{hrCostData.roleMultiplier}x ({employee.position})</span>
                    </div>
                  )}
                </div>
              </div>
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

export default EmployeeDetailModal;