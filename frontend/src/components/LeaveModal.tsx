import React, { useState } from 'react';
import { Employee } from '../types/employee';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  onSubmit: (data: LeaveRequestData) => void;
}

export interface LeaveRequestData {
  startDate: string;
  returnDate: string;
  reason: string;
  payType: 'paid' | 'unpaid';
  memo: string;
}

const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, onClose, employee, onSubmit }) => {
  const [formData, setFormData] = useState<LeaveRequestData>({
    startDate: '',
    returnDate: '',
    reason: '출산휴가',
    payType: 'paid',
    memo: ''
  });

  // 유효성 검사 함수
  const validateForm = (): string | null => {
    // 휴직 시작일 필수 입력
    if (!formData.startDate) {
      return '휴직 시작일을 입력해주세요.';
    }

    // 복직 예정일 필수 입력
    if (!formData.returnDate) {
      return '복직 예정일을 입력해주세요.';
    }

    const startDate = new Date(formData.startDate);
    const returnDate = new Date(formData.returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 부분 제거

    // 휴직 시작일이 오늘 이전인지 확인 (당일은 허용)
    if (startDate < today) {
      return '휴직 시작일은 오늘 이후로 입력해주세요.';
    }

    // 복직 예정일이 휴직 시작일보다 이후인지 확인
    if (returnDate <= startDate) {
      return '복직 예정일은 휴직 시작일보다 이후여야 합니다.';
    }

    // 휴직 기간이 너무 긴지 확인 (2년 이내로 제한)
    const maxReturnDate = new Date(startDate);
    maxReturnDate.setFullYear(maxReturnDate.getFullYear() + 2);
    
    if (returnDate > maxReturnDate) {
      return '휴직 기간은 최대 2년까지 가능합니다.';
    }

    // 휴직 기간이 최소 1일 이상인지 확인
    const diffTime = returnDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return '휴직 기간은 최소 1일 이상이어야 합니다.';
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
    onSubmit(formData);
    
    // 폼 초기화
    setFormData({
      startDate: '',
      returnDate: '',
      reason: '출산휴가',
      payType: 'paid',
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
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl relative z-50">
        <header className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg">휴직 등록</h3>
        </header>
        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-500">이름</label>
              <p className="mt-1 font-semibold">{employee?.name}</p>
            </div>
            <div>
              <label className="block font-medium text-slate-500">사번</label>
              <p className="mt-1 font-semibold">{employee?.empNo}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                휴직 시작일 <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                value={formData.startDate}
                min={new Date().toISOString().split('T')[0]} // 오늘 이후만 선택 가능
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className={`w-full p-2 border rounded-md ${
                  !formData.startDate 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-slate-300 focus:border-indigo-500'
                }`}
              />
              {!formData.startDate && (
                <p className="text-xs text-red-500 mt-1">휴직 시작일을 입력해주세요</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                복직 예정일 <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                value={formData.returnDate}
                min={formData.startDate || new Date().toISOString().split('T')[0]} // 시작일 이후만 선택 가능
                onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                className={`w-full p-2 border rounded-md ${
                  !formData.returnDate || (formData.startDate && formData.returnDate <= formData.startDate)
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-slate-300 focus:border-indigo-500'
                }`}
              />
              {!formData.returnDate && (
                <p className="text-xs text-red-500 mt-1">복직 예정일을 입력해주세요</p>
              )}
              {formData.startDate && formData.returnDate && formData.returnDate <= formData.startDate && (
                <p className="text-xs text-red-500 mt-1">복직 예정일은 휴직 시작일보다 이후여야 합니다</p>
              )}
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">휴직 사유</label>
            <select 
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-md"
            >
              <option>출산휴가</option>
              <option>육아휴직</option>
              <option>질병휴직</option>
              <option>기타</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">급여</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="payType" 
                  value="paid"
                  checked={formData.payType === 'paid'}
                  onChange={(e) => setFormData({...formData, payType: e.target.value as 'paid' | 'unpaid'})}
                  className="mr-2"
                /> 
                유급휴가
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="payType" 
                  value="unpaid"
                  checked={formData.payType === 'unpaid'}
                  onChange={(e) => setFormData({...formData, payType: e.target.value as 'paid' | 'unpaid'})}
                  className="mr-2"
                /> 
                무급휴가
              </label>
            </div>
          </div>
          {/* 휴직 기간 정보 표시 */}
          {formData.startDate && formData.returnDate && formData.returnDate > formData.startDate && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">휴직 기간 정보</h4>
              <div className="text-xs text-blue-700">
                <p>
                  <strong>휴직 기간:</strong> {
                    (() => {
                      const start = new Date(formData.startDate);
                      const end = new Date(formData.returnDate);
                      const diffTime = end.getTime() - start.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const diffMonths = Math.floor(diffDays / 30);
                      const remainingDays = diffDays % 30;
                      
                      if (diffMonths > 0) {
                        return `약 ${diffMonths}개월 ${remainingDays}일 (총 ${diffDays}일)`;
                      } else {
                        return `${diffDays}일`;
                      }
                    })()
                  }
                </p>
                <p>
                  <strong>급여:</strong> {formData.payType === 'paid' ? '유급휴가' : '무급휴가'}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-600 mb-1">MEMO</label>
            <textarea 
              rows={3} 
              value={formData.memo}
              onChange={(e) => setFormData({...formData, memo: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-md"
              placeholder="추가 메모사항이 있으면 입력해주세요..."
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
            disabled={!formData.startDate || !formData.returnDate || (!!formData.startDate && !!formData.returnDate && formData.returnDate <= formData.startDate)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              !formData.startDate || !formData.returnDate || (!!formData.startDate && !!formData.returnDate && formData.returnDate <= formData.startDate)
                ? 'text-slate-400 bg-slate-300 cursor-not-allowed'
                : 'text-white bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            휴직 등록
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LeaveModal;