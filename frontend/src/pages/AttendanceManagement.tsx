import React, { useState, useEffect } from 'react';
import { LeaveRequest as FrontendLeaveRequest, LeaveBalance as FrontendLeaveBalance, Employee } from '../types/attendance';
import { LeaveRequest, LeaveBalance, attendanceApi, LeaveType, RequestStatus } from '../services/attendanceApi';
import { employeeApi } from '../services/employeeApi';
import LeaveRequestModal from '../components/LeaveRequestModal';
import CancelRequestModal from '../components/CancelRequestModal';

const AttendanceManagement: React.FC = () => {
  const [leaveBalance, setLeaveBalance] = useState<FrontendLeaveBalance>({
    total: 0,
    used: 0,
    remaining: 0
  });
  const [leaveRequests, setLeaveRequests] = useState<FrontendLeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmployeeId] = useState(1); // 현재 로그인한 직원 ID (임시)

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 직원 목록 가져오기
      const employeesData = await employeeApi.getActive();
      setEmployees(employeesData.map(emp => ({
        id: emp.id,
        name: emp.name,
        department: emp.department,
        position: emp.position
      })));

      // 현재 직원의 휴가 잔액 가져오기
      try {
        const balanceData = await attendanceApi.getLeaveBalance(currentEmployeeId);
        setLeaveBalance({
          total: typeof balanceData.total === 'string' ? parseFloat(balanceData.total) : balanceData.total,
          used: typeof balanceData.used === 'string' ? parseFloat(balanceData.used) : balanceData.used,
          remaining: typeof balanceData.remaining === 'string' ? parseFloat(balanceData.remaining) : balanceData.remaining
        });
      } catch (error) {
        console.log('No leave balance data available');
      }

      // 현재 직원의 휴가 신청 내역 가져오기
      try {
        const requestsData = await attendanceApi.getLeaveRequestsByEmployee(currentEmployeeId);
        setLeaveRequests(convertToFrontendRequests(requestsData));
      } catch (error) {
        console.log('No leave requests data available');
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToFrontendRequests = (backendRequests: LeaveRequest[]): FrontendLeaveRequest[] => {
    return backendRequests.map(req => ({
      id: req.id,
      type: req.type as any,
      startDate: new Date(req.startDate).toISOString().split('T')[0],
      endDate: new Date(req.endDate).toISOString().split('T')[0],
      days: typeof req.days === 'string' ? parseFloat(req.days) : req.days,
      reason: req.reason,
      status: req.status as any,
      requestDate: new Date(req.requestDate).toISOString().split('T')[0],
      approver: req.approver,
      rejectReason: req.rejectReason
    }));
  };

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FrontendLeaveRequest | undefined>();
  const [editingRequest, setEditingRequest] = useState<FrontendLeaveRequest | undefined>();

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

  const handleNewRequest = async (newRequest: Omit<FrontendLeaveRequest, 'id' | 'requestDate' | 'status'>) => {
    try {
      if (editingRequest) {
        // 수정 모드
        await attendanceApi.updateLeaveRequest(editingRequest.id, {
          type: newRequest.type as LeaveType,
          startDate: newRequest.startDate,
          endDate: newRequest.endDate,
          days: newRequest.days,
          reason: newRequest.reason
        });
        setEditingRequest(undefined);
      } else {
        // 새 신청 모드
        await attendanceApi.createLeaveRequest({
          type: newRequest.type as LeaveType,
          startDate: newRequest.startDate,
          endDate: newRequest.endDate,
          days: newRequest.days,
          reason: newRequest.reason,
          employeeId: currentEmployeeId
        });
      }
      
      // 데이터 새로고침
      await fetchData();
      setIsRequestModalOpen(false);
    } catch (error) {
      console.error('Failed to save leave request:', error);
    }
  };

  const handleCancelRequest = async (requestId: number, reason: string) => {
    try {
      await attendanceApi.deleteLeaveRequest(requestId);
      await fetchData(); // 데이터 새로고침
      setIsCancelModalOpen(false);
      setSelectedRequest(undefined);
    } catch (error) {
      console.error('Failed to cancel leave request:', error);
    }
  };

  const openCancelModal = (request: FrontendLeaveRequest) => {
    setSelectedRequest(request);
    setIsCancelModalOpen(true);
  };

  const openEditModal = (request: FrontendLeaveRequest) => {
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
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      휴가 신청 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((request) => (
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
                  ))
                )}
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