import React, { useState } from 'react';
import { LeaveRequest, LeaveBalance, Employee } from '../types/attendance';
import LeaveRequestModal from '../components/LeaveRequestModal';
import CancelRequestModal from '../components/CancelRequestModal';

const AttendanceManagement: React.FC = () => {
  const [leaveBalance] = useState<LeaveBalance>({
    total: 15,
    used: 3,
    remaining: 12
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: 1,
      type: '연차',
      startDate: '2025-08-15',
      endDate: '2025-08-15',
      days: 1,
      reason: '개인 사유',
      status: '승인',
      requestDate: '2025-08-01',
      approver: '박영훈'
    },
    {
      id: 2,
      type: '오전 반차',
      startDate: '2025-08-10',
      endDate: '2025-08-10',
      days: 0.5,
      reason: '병원 진료',
      status: '상신중',
      requestDate: '2025-08-05'
    },
    {
      id: 3,
      type: '연차',
      startDate: '2025-07-20',
      endDate: '2025-07-22',
      days: 3,
      reason: '가족 여행',
      status: '반려',
      requestDate: '2025-07-15',
      rejectReason: '업무 일정 충돌'
    }
  ]);

  const [employees] = useState<Employee[]>([
    { id: 1, name: '윤승현', department: '개발팀', position: '팀장' },
    { id: 2, name: '박영훈', department: '개발팀', position: '선임' }
  ]);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | undefined>();
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | undefined>();

  const getStatusStyle = (status: string) => {
    const styles = {
      '승인': 'bg-green-100 text-green-800',
      '상신중': 'bg-yellow-100 text-yellow-800',
      '반려': 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleNewRequest = (newRequest: Omit<LeaveRequest, 'id' | 'requestDate' | 'status'>) => {
    if (editingRequest) {
      // 수정 모드
      const updatedRequests = leaveRequests.map(req =>
        req.id === editingRequest.id
          ? { ...req, ...newRequest }
          : req
      );
      setLeaveRequests(updatedRequests);
      setEditingRequest(undefined);
    } else {
      // 새 신청 모드
      const request: LeaveRequest = {
        ...newRequest,
        id: Math.max(...leaveRequests.map(r => r.id)) + 1,
        requestDate: new Date().toISOString().split('T')[0],
        status: '상신중'
      };
      setLeaveRequests([...leaveRequests, request]);
    }
    setIsRequestModalOpen(false);
  };

  const handleCancelRequest = (requestId: number, reason: string) => {
    setLeaveRequests(leaveRequests.filter(r => r.id !== requestId));
    setIsCancelModalOpen(false);
    setSelectedRequest(undefined);
  };

  const openCancelModal = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsCancelModalOpen(true);
  };

  const openEditModal = (request: LeaveRequest) => {
    setEditingRequest(request);
    setIsRequestModalOpen(true);
  };

  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false);
    setEditingRequest(undefined);
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">근태 관리</h1>
            <p className="text-slate-500 mt-1">휴가 및 근무 시간을 관리합니다.</p>
          </div>
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            + 휴가 신청
          </button>
        </header>

        {/* 연차 현황 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">발생</p>
                <p className="text-2xl font-bold text-slate-900">{leaveBalance.total}일</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">사용</p>
                <p className="text-2xl font-bold text-slate-900">{leaveBalance.used}일</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">잔여</p>
                <p className="text-2xl font-bold text-slate-900">{leaveBalance.remaining}일</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 휴가 신청 내역 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">휴가 신청 내역</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-left">구분</th>
                  <th className="px-6 py-3 font-medium text-left">시작일</th>
                  <th className="px-6 py-3 font-medium text-left">종료일</th>
                  <th className="px-6 py-3 font-medium text-center">일수</th>
                  <th className="px-6 py-3 font-medium text-left">사유</th>
                  <th className="px-6 py-3 font-medium text-center">상태</th>
                  <th className="px-6 py-3 font-medium text-left">신청일</th>
                  <th className="px-6 py-3 font-medium text-center">액션</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {leaveRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium">{request.type}</td>
                    <td className="px-6 py-4">{formatDate(request.startDate)}</td>
                    <td className="px-6 py-4">{formatDate(request.endDate)}</td>
                    <td className="px-6 py-4 text-center">{request.days}일</td>
                    <td className="px-6 py-4 max-w-xs truncate">{request.reason}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatDate(request.requestDate)}</td>
                    <td className="px-6 py-4 text-center">
                      {request.status === '상신중' && (
                        <div className="space-x-2">
                          <button 
                            onClick={() => openEditModal(request)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => openCancelModal(request)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            취소
                          </button>
                        </div>
                      )}
                      {request.status === '반려' && request.rejectReason && (
                        <span className="text-xs text-slate-500" title={request.rejectReason}>
                          반려사유
                        </span>
                      )}
                      {request.status === '승인' && (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <LeaveRequestModal
        isOpen={isRequestModalOpen}
        onClose={handleCloseRequestModal}
        onSave={handleNewRequest}
        employees={employees}
        editingRequest={editingRequest}
      />

      <CancelRequestModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedRequest(undefined);
        }}
        onConfirm={handleCancelRequest}
        request={selectedRequest}
      />
    </>
  );
};

export default AttendanceManagement;