import React, { useState } from 'react';
import { Employee } from '../types/employee';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  onSubmit: (data: ReturnRequestData) => void;
}

export interface ReturnRequestData {
  returnDate: string;
  memo: string;
}

const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, employee, onSubmit }) => {
  const [formData, setFormData] = useState<ReturnRequestData>({
    returnDate: '',
    memo: ''
  });

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      returnDate: '',
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
          <h3 className="font-bold text-lg">복직 등록</h3>
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
              <label className="block font-medium text-slate-500">휴직 시작일</label>
              <p className="mt-1 font-semibold">2024-01-01</p>
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">복직일</label>
              <input 
                type="date" 
                value={formData.returnDate}
                onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
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
            복직 등록
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ReturnModal;