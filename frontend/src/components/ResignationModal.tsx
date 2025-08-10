import React, { useState, useEffect } from 'react';
import { Employee } from '../types/employee';

interface ResignationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  onSubmit: (data: ResignationRequestData) => void;
}

export interface ResignationRequestData {
  resignDate: string;
  endDate: string;
  reason: string;
  leaveAccrued: number;
  leaveUsed: number;
  leaveRemaining: number;
  leaveAllowance: number;
  severancePay: 'yes' | 'no';
  memo: string;
}

const ResignationModal: React.FC<ResignationModalProps> = ({ isOpen, onClose, employee, onSubmit }) => {
  const [formData, setFormData] = useState<ResignationRequestData>({
    resignDate: '',
    endDate: '',
    reason: '',
    leaveAccrued: 15,
    leaveUsed: 10,
    leaveRemaining: 5,
    leaveAllowance: 0,
    severancePay: 'yes',
    memo: ''
  });

  // 연차 자동 계산 함수
  const calculateLeaveEntitlement = (joinDate: Date, resignDate: Date) => {
    const currentYear = new Date().getFullYear();
    const joinYear = joinDate.getFullYear();
    const resignYear = resignDate.getFullYear();
    
    // 근무 기간 계산 (년)
    const workingYears = resignYear - joinYear;
    
    // 기본 연차: 1년 근무 시 15일, 3년 근무 시부터 매년 1일씩 추가 (최대 25일)
    let annualLeave = 15;
    if (workingYears >= 3) {
      annualLeave = Math.min(15 + (workingYears - 1), 25);
    }
    
    // 퇴사년도 비례 계산
    if (resignYear === currentYear) {
      const yearStart = new Date(currentYear, 0, 1);
      const resignDateObj = new Date(resignDate);
      
      // 퇴사일까지의 비례 연차
      const daysInYear = 365; // 또는 윤년 체크
      const daysPassed = Math.floor((resignDateObj.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
      annualLeave = Math.floor((annualLeave * daysPassed) / daysInYear);
    }
    
    return annualLeave;
  };

  // 월급 기준 일당 계산 (연차 수당용)
  const calculateDailyWage = (monthlySalary: number) => {
    // 월급 / 30일 (평균 월 근무일수)
    return Math.floor(monthlySalary / 30);
  };

  // 직원 정보가 변경되거나 퇴사일이 변경될 때 자동 계산
  useEffect(() => {
    if (employee && formData.resignDate) {
      const resignDate = new Date(formData.resignDate);
      const joinDate = new Date(employee.joinDate);
      
      // 연차 발생일수 자동 계산
      const calculatedLeaveAccrued = calculateLeaveEntitlement(joinDate, resignDate);
      
      // 현재 연도 사용 연차 (leaveBalance에서 가져오기)
      const currentYear = new Date().getFullYear();
      let usedLeave = 0;
      
      if (employee.leaveBalance && employee.leaveBalance.length > 0) {
        const currentLeaveBalance = employee.leaveBalance.find(lb => lb.year === currentYear);
        usedLeave = currentLeaveBalance ? Number(currentLeaveBalance.used) : 0;
      }
      
      // 잔여 연차 계산
      const remaining = Math.max(0, calculatedLeaveAccrued - usedLeave);
      
      // 일당 기준 연차 수당 계산
      const dailyWage = calculateDailyWage(employee.monthlySalary);
      const allowance = remaining * dailyWage;
      
      setFormData(prev => ({
        ...prev,
        leaveAccrued: calculatedLeaveAccrued,
        leaveUsed: usedLeave,
        leaveRemaining: remaining,
        leaveAllowance: allowance
      }));
    }
  }, [employee, formData.resignDate]);

  // 수동으로 발생/사용 연차를 변경했을 때의 계산
  useEffect(() => {
    const remaining = Math.max(0, formData.leaveAccrued - formData.leaveUsed);
    const dailyWage = employee ? calculateDailyWage(employee.monthlySalary) : 100000;
    const allowance = remaining * dailyWage;
    
    setFormData(prev => ({
      ...prev,
      leaveRemaining: remaining,
      leaveAllowance: allowance
    }));
  }, [formData.leaveAccrued, formData.leaveUsed, employee]);

  // 유효성 검사 함수
  const validateForm = (): string | null => {
    // 퇴사일 필수 입력
    if (!formData.resignDate) {
      return '퇴사일을 입력해주세요.';
    }

    // 퇴사 사유 필수 입력
    if (!formData.reason.trim()) {
      return '퇴사 사유를 입력해주세요.';
    }

    // 퇴사일이 입사일보다 이후인지 확인
    if (employee?.joinDate) {
      const joinDate = new Date(employee.joinDate);
      const resignDate = new Date(formData.resignDate);
      
      if (resignDate <= joinDate) {
        return '퇴사일은 입사일보다 이후여야 합니다.';
      }
    }

    // 퇴사일이 너무 먼 미래인지 확인 (5년 후까지만 허용)
    const resignDate = new Date(formData.resignDate);
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);
    
    if (resignDate > maxFutureDate) {
      return '퇴사일은 5년 이내로 입력해주세요.';
    }

    // 연차 관련 수치 검증
    if (formData.leaveAccrued < 0) {
      return '발생 연차는 0 이상이어야 합니다.';
    }

    if (formData.leaveUsed < 0) {
      return '사용 연차는 0 이상이어야 합니다.';
    }

    if (formData.leaveUsed > formData.leaveAccrued) {
      return '사용 연차는 발생 연차보다 클 수 없습니다.';
    }

    return null; // 유효성 검사 통과
  };

  const handleSubmit = () => {
    // 유효성 검사 실행
    const validationError = validateForm();
    
    if (validationError) {
      alert(validationError);
      return;
    }

    // 유효성 검사 통과 시 제출
    onSubmit({
      ...formData,
      endDate: formData.resignDate
    });
    
    // 폼 초기화
    setFormData({
      resignDate: '',
      endDate: '',
      reason: '',
      leaveAccrued: 15,
      leaveUsed: 10,
      leaveRemaining: 5,
      leaveAllowance: 0,
      severancePay: 'yes',
      memo: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      ></div>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl relative z-50">
        <header className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg">퇴사 등록</h3>
        </header>
        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block font-medium text-slate-500">이름</label>
              <p className="mt-1 font-semibold">{employee?.name}</p>
            </div>
            <div>
              <label className="block font-medium text-slate-500">사번</label>
              <p className="mt-1 font-semibold">{employee?.empNo}</p>
            </div>
            <div>
              <label className="block font-medium text-slate-500">입사일</label>
              <p className="mt-1 font-semibold">
                {employee?.joinDate ? new Date(employee.joinDate).toLocaleDateString('ko-KR') : '-'}
              </p>
            </div>
            <div>
              <label className="block font-medium text-slate-500">근무기간</label>
              <p className="mt-1 font-semibold">
                {employee?.joinDate && formData.resignDate ? 
                  (() => {
                    const joinYear = new Date(employee.joinDate).getFullYear();
                    const resignYear = new Date(formData.resignDate).getFullYear();
                    const workingYears = resignYear - joinYear;
                    return `${workingYears}년`;
                  })()
                  : '-'
                }
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                퇴사일 <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                value={formData.resignDate}
                onChange={(e) => setFormData({...formData, resignDate: e.target.value})}
                className={`w-full p-2 border rounded-md ${
                  !formData.resignDate 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-slate-300 focus:border-indigo-500'
                }`}
              />
              {!formData.resignDate && (
                <p className="text-xs text-red-500 mt-1">퇴사일을 입력해주세요</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                퇴사 사유 <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className={`w-full p-2 border rounded-md ${
                  !formData.reason.trim() 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-slate-300 focus:border-indigo-500'
                }`}
                placeholder="예: 개인 사정으로 인한 퇴사"
              />
              {!formData.reason.trim() && (
                <p className="text-xs text-red-500 mt-1">퇴사 사유를 입력해주세요</p>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-medium text-slate-600">급여 정산</label>
              <div className="text-xs text-slate-500">
                * 퇴사일 입력 시 자동 계산됩니다 (근무년수 기반)
              </div>
            </div>
            {/* 연차 계산 공식 안내 */}
            {formData.resignDate && employee && (
              <div className="mb-2 p-2 bg-blue-50 rounded-md text-xs text-blue-700">
                <strong>연차 계산 기준:</strong> 1년 근무 시 15일, 3년 이상 근무 시 매년 1일 추가 (최대 25일)
                <br />
                <strong>연차 수당:</strong> 월급 ÷ 30일 × 잔여 연차일수
              </div>
            )}
            <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-md">
              <div>
                <label className="block text-xs text-slate-500">발생 연차</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.leaveAccrued}
                  onChange={(e) => setFormData({...formData, leaveAccrued: Math.max(0, parseInt(e.target.value) || 0)})}
                  className={`w-full p-1 border rounded-md ${
                    formData.leaveAccrued < 0 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-300 focus:border-indigo-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">사용 연차</label>
                <input 
                  type="number" 
                  min="0"
                  max={formData.leaveAccrued}
                  value={formData.leaveUsed}
                  onChange={(e) => setFormData({...formData, leaveUsed: Math.max(0, parseInt(e.target.value) || 0)})}
                  className={`w-full p-1 border rounded-md ${
                    formData.leaveUsed < 0 || formData.leaveUsed > formData.leaveAccrued
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-300 focus:border-indigo-500'
                  }`}
                />
                {formData.leaveUsed > formData.leaveAccrued && (
                  <p className="text-xs text-red-500 mt-1">발생 연차를 초과할 수 없습니다</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500">잔여 연차</label>
                <input 
                  type="text" 
                  value={formData.leaveRemaining}
                  readOnly 
                  className="w-full p-1 border-slate-300 rounded-md bg-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">연차 수당 (원)</label>
                <input 
                  type="text" 
                  value={formData.leaveAllowance.toLocaleString()}
                  readOnly 
                  className="w-full p-1 border-slate-300 rounded-md bg-slate-200"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">퇴직금 지급 여부</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="severancePay" 
                  value="yes"
                  checked={formData.severancePay === 'yes'}
                  onChange={(e) => setFormData({...formData, severancePay: e.target.value as 'yes' | 'no'})}
                  className="mr-2"
                /> 
                여
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="severancePay" 
                  value="no"
                  checked={formData.severancePay === 'no'}
                  onChange={(e) => setFormData({...formData, severancePay: e.target.value as 'yes' | 'no'})}
                  className="mr-2"
                /> 
                부
              </label>
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">MEMO</label>
            <textarea 
              rows={3} 
              value={formData.memo}
              onChange={(e) => setFormData({...formData, memo: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-md"
            ></textarea>
          </div>
        </div>
        <footer className="p-4 bg-slate-50 flex justify-end space-x-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            취소
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!formData.resignDate || !formData.reason.trim()}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              !formData.resignDate || !formData.reason.trim()
                ? 'text-slate-400 bg-slate-300 cursor-not-allowed'
                : 'text-white bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            퇴사 등록
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ResignationModal;