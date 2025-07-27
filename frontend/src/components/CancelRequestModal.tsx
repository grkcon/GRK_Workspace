import React, { useState } from 'react';
import { LeaveRequest } from '../types/attendance';

interface CancelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (requestId: number, reason: string) => void;
  request?: LeaveRequest;
}

const CancelRequestModal: React.FC<CancelRequestModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  request 
}) => {
  const [cancelReason, setCancelReason] = useState('');

  const handleConfirm = () => {
    if (!request) return;
    
    if (!cancelReason.trim()) {
      alert('취소 사유를 입력해주세요.');
      return;
    }

    onConfirm(request.id, cancelReason.trim());
    setCancelReason('');
  };

  const handleClose = () => {
    setCancelReason('');
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={handleClose}
      ></div>
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl relative z-50">
        <header className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-lg text-slate-800">휴가 신청 취소</h3>
        </header>
        
        <div className="p-6 space-y-4">
          {/* 신청 정보 요약 */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-slate-800">취소할 신청 내역</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>구분:</span>
                <span className="font-medium">{request.type}</span>
              </div>
              <div className="flex justify-between">
                <span>기간:</span>
                <span className="font-medium">
                  {formatDate(request.startDate)}
                  {request.startDate !== request.endDate && ` ~ ${formatDate(request.endDate)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>일수:</span>
                <span className="font-medium">{request.days}일</span>
              </div>
              <div className="flex justify-between">
                <span>사유:</span>
                <span className="font-medium">{request.reason}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              취소 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="휴가 신청을 취소하는 사유를 입력해주세요"
              rows={3}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              required
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>주의:</strong> 신청을 취소하면 복구할 수 없습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="p-6 bg-slate-50 flex justify-end space-x-3 rounded-b-xl">
          <button 
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            닫기
          </button>
          <button 
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            취소 확인
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CancelRequestModal;