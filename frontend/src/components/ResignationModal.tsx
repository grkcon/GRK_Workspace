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
    reason: '',
    leaveAccrued: 15,
    leaveUsed: 10,
    leaveRemaining: 5,
    leaveAllowance: 0,
    severancePay: 'yes',
    memo: ''
  });

  // 잔여 연차 및 연차 수당 자동 계산
  useEffect(() => {
    const remaining = formData.leaveAccrued - formData.leaveUsed;
    const allowance = remaining * 100000; // 연차 하루당 10만원 가정
    
    setFormData(prev => ({
      ...prev,
      leaveRemaining: remaining,
      leaveAllowance: allowance
    }));
  }, [formData.leaveAccrued, formData.leaveUsed]);

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      resignDate: '',
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
          <h3 className="font-bold text-lg">퇴사 신청</h3>
        </header>
        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-500">이름</label>
              <p className="mt-1 font-semibold">{employee?.name}</p>
            </div>
            <div>
              <label className="block font-medium text-slate-500">사번</label>
              <p className="mt-1 font-semibold">{employee?.emp_no}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-600 mb-1">퇴사일</label>
              <input 
                type="date" 
                value={formData.resignDate}
                onChange={(e) => setFormData({...formData, resignDate: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">퇴사 사유</label>
              <input 
                type="text" 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">급여 정산</label>
            <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-md">
              <div>
                <label className="block text-xs text-slate-500">발생 연차</label>
                <input 
                  type="number" 
                  value={formData.leaveAccrued}
                  onChange={(e) => setFormData({...formData, leaveAccrued: parseInt(e.target.value) || 0})}
                  className="w-full p-1 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">사용 연차</label>
                <input 
                  type="number" 
                  value={formData.leaveUsed}
                  onChange={(e) => setFormData({...formData, leaveUsed: parseInt(e.target.value) || 0})}
                  className="w-full p-1 border border-slate-300 rounded-md"
                />
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
                <label className="block text-xs text-slate-500">연차 수당</label>
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
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            퇴사 등록
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ResignationModal;