import React, { useState, useEffect } from 'react';

interface PendingRequest {
  id: number;
  applicant: string;
  type: string;
  period: string;
  reason: string;
}

interface EmployeeLeaveBalance {
  id: number;
  name: string;
  totalLeave: number;
  usedLeave: number;
  remainingLeave: number;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  request: PendingRequest | null;
  isApproval: boolean;
  onClose: () => void;
  onConfirm: (requestId: number, isApproved: boolean) => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  request, 
  isApproval, 
  onClose, 
  onConfirm 
}) => {
  if (!isOpen || !request) return null;

  const action = isApproval ? '승인' : '반려';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      <div 
        className={`w-full max-w-md bg-white rounded-xl shadow-2xl relative z-10 transform transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="p-6">
          <h3 className="font-bold text-lg">신청 {action} 확인</h3>
          <div className="mt-2 p-3 bg-slate-50 rounded-md text-sm">
            <p><span className="font-semibold">신청자:</span> {request.applicant}</p>
            <p><span className="font-semibold">기간:</span> {request.period}</p>
          </div>
          <p className="mt-4 text-sm text-slate-600">이 요청을 처리하시겠습니까?</p>
        </div>
        <footer className="p-4 bg-slate-50 flex justify-end space-x-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            취소
          </button>
          <button 
            onClick={() => onConfirm(request.id, isApproval)}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg ${
              isApproval 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {action}
          </button>
        </footer>
      </div>
    </div>
  );
};

const AttendanceAdmin: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]); // 빈 배열로 시작
  const [leaveBalances] = useState<EmployeeLeaveBalance[]>([]); // 빈 배열로 시작
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproval, setIsApproval] = useState(false);

  const openConfirmationModal = (request: PendingRequest, isApproved: boolean) => {
    setSelectedRequest(request);
    setIsApproval(isApproved);
    setIsModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setSelectedRequest(null);
    setIsModalOpen(false);
  };

  const handleSubmitApproval = (requestId: number, isApproved: boolean) => {
    // 요청 목록에서 해당 항목 제거
    setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    
    // 실제 앱에서는 API 호출
    const action = isApproved ? '승인' : '반려';
    alert(`${action} 처리되었습니다.`);
    
    closeConfirmationModal();
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">근태 관리 (Admin)</h1>
          <p className="text-slate-500 mt-1">전 직원의 근태 신청을 관리하고 현황을 확인합니다.</p>
        </div>
      </header>

      {/* 결재 대기 목록 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-700 mb-4">
          결재 대기 목록 ({pendingRequests.length})
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-left">신청자</th>
                  <th className="px-6 py-3 font-medium text-left">구분</th>
                  <th className="px-6 py-3 font-medium text-left">기간</th>
                  <th className="px-6 py-3 font-medium text-left">사유</th>
                  <th className="px-6 py-3 font-medium text-center">관리</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {pendingRequests.length === 0 ? (
                  <tr className="border-t border-slate-200">
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      결재 대기 중인 항목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((request) => (
                    <tr key={request.id} className="border-t border-slate-200">
                      <td className="px-6 py-4 font-semibold">{request.applicant}</td>
                      <td className="px-6 py-4">{request.type}</td>
                      <td className="px-6 py-4">{request.period}</td>
                      <td className="px-6 py-4">{request.reason}</td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button 
                          onClick={() => openConfirmationModal(request, true)}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                          승인
                        </button>
                        <button 
                          onClick={() => openConfirmationModal(request, false)}
                          className="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700"
                        >
                          반려
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      {/* 직원별 연차 현황 */}
      <section>
        <h2 className="text-xl font-bold text-slate-700 mb-4">직원별 연차 현황</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-left">이름</th>
                  <th className="px-6 py-3 font-medium text-right">발생 연차</th>
                  <th className="px-6 py-3 font-medium text-right">사용 연차</th>
                  <th className="px-6 py-3 font-medium text-right">잔여 연차</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {leaveBalances.length === 0 ? (
                  <tr className="border-t border-slate-200">
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      연차 현황 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  leaveBalances.map((balance) => (
                    <tr key={balance.id} className="border-t border-slate-200">
                      <td className="px-6 py-4 font-semibold">{balance.name}</td>
                      <td className="px-6 py-4 text-right">{balance.totalLeave.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right">{balance.usedLeave.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600">
                        {balance.remainingLeave.toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ConfirmationModal
        isOpen={isModalOpen}
        request={selectedRequest}
        isApproval={isApproval}
        onClose={closeConfirmationModal}
        onConfirm={handleSubmitApproval}
      />
    </div>
  );
};

export default AttendanceAdmin;