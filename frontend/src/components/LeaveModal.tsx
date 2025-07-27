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

  const handleSubmit = () => {
    onSubmit(formData);
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
          <h3 className="font-bold text-lg">휴직 신청</h3>
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
              <label className="block font-medium text-slate-600 mb-1">휴직 시작일</label>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">복직 예정일</label>
              <input 
                type="date" 
                value={formData.returnDate}
                onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
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
            휴직 등록
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LeaveModal;