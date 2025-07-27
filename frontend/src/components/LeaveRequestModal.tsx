import React, { useState, useEffect } from 'react';
import { LeaveRequest, LeaveType, Employee } from '../types/attendance';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: Omit<LeaveRequest, 'id' | 'requestDate' | 'status'>) => void;
  employees: Employee[];
  editingRequest?: LeaveRequest;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  employees,
  editingRequest
}) => {
  const [formData, setFormData] = useState({
    type: '연차' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
    days: 0
  });

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      calculateDays();
    }
  }, [formData.startDate, formData.endDate, formData.type]);

  useEffect(() => {
    if (editingRequest) {
      // 편집 모드일 때 기존 데이터로 폼 초기화
      setFormData({
        type: editingRequest.type,
        startDate: editingRequest.startDate,
        endDate: editingRequest.endDate,
        reason: editingRequest.reason,
        days: editingRequest.days
      });
    } else {
      // 새 신청 모드일 때 폼 초기화
      setFormData({
        type: '연차',
        startDate: '',
        endDate: '',
        reason: '',
        days: 0
      });
    }
  }, [editingRequest, isOpen]);

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (start > end) {
      setFormData(prev => ({ ...prev, days: 0 }));
      return;
    }

    let days = 0;
    
    if (formData.type === '오전 반차' || formData.type === '오후 반차') {
      days = 0.5;
    } else {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // 주말 제외 (간단한 계산)
      let weekendDays = 0;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0 || d.getDay() === 6) {
          weekendDays++;
        }
      }
      days -= weekendDays;
    }

    setFormData(prev => ({ ...prev, days }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    onSave({
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      days: formData.days,
      reason: formData.reason.trim()
    });

    // 폼 초기화
    setFormData({
      type: '연차',
      startDate: '',
      endDate: '',
      reason: '',
      days: 0
    });
  };

  const handleClose = () => {
    setFormData({
      type: '연차',
      startDate: '',
      endDate: '',
      reason: '',
      days: 0
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={handleClose}
      ></div>
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl relative z-50">
        <header className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-lg text-slate-800">
            {editingRequest ? '휴가 신청 수정' : '휴가 신청'}
          </h3>
        </header>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              휴가 구분 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as LeaveType})}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="연차">연차</option>
              <option value="오전 반차">오전 반차</option>
              <option value="오후 반차">오후 반차</option>
              <option value="휴일 근무">휴일 근무</option>
              <option value="대체 휴가">대체 휴가</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                시작일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                종료일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={formData.type === '오전 반차' || formData.type === '오후 반차'}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              신청일수
            </label>
            <input
              type="text"
              value={`${formData.days}일`}
              className="w-full p-3 border border-slate-300 rounded-lg bg-slate-100"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              휴가 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              placeholder="휴가 사유를 입력해주세요"
              rows={3}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              required
            />
          </div>
        </form>

        <footer className="p-6 bg-slate-50 flex justify-end space-x-3 rounded-b-xl">
          <button 
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            취소
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            {editingRequest ? '수정 완료' : '신청'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LeaveRequestModal;