import React, { useState, useEffect } from 'react';
import { Employee } from '../types/employee';
import { employeeApi } from '../services/employeeApi';
import EmployeeForm, { getEmployeeFormData } from '../components/EmployeeForm';
import LeaveModal, { LeaveRequestData } from '../components/LeaveModal';
import ReturnModal, { ReturnRequestData } from '../components/ReturnModal';
import ResignationModal, { ResignationRequestData } from '../components/ResignationModal';

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isResignationModalOpen, setIsResignationModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeApi.getAll();
      setEmployees(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError('직원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openPanel = (panelMode: 'view' | 'edit' | 'new', employee?: Employee) => {
    setMode(panelMode);
    setSelectedEmployee(employee);
    setIsEditing(panelMode !== 'view');
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setIsEditing(false);
    setSelectedEmployee(undefined);
  };

  const setEditMode = (editing: boolean) => {
    setIsEditing(editing);
    if (editing && mode === 'view') {
      setMode('edit');
    } else if (!editing && mode === 'edit') {
      setMode('view');
    }
  };

  const saveEmployee = async () => {
    try {
      const formData = getEmployeeFormData();
      if (!formData) {
        setError('폼 데이터를 가져올 수 없습니다.');
        return;
      }

      if (mode === 'new') {
        console.log('Creating new employee...', formData);
        await employeeApi.create(formData);
      } else if (mode === 'edit' && selectedEmployee) {
        console.log('Updating employee...', formData);
        const { education, experience, ...updateData } = formData;
        await employeeApi.update(selectedEmployee.id, updateData);
      }
      closePanel();
      await fetchEmployees(); // Refresh the list
    } catch (err) {
      console.error('Failed to save employee:', err);
      setError('직원 정보 저장에 실패했습니다.');
    }
  };

  const handleLeaveRequest = async (data: LeaveRequestData) => {
    try {
      if (selectedEmployee) {
        await employeeApi.update(selectedEmployee.id, { status: 'ON_LEAVE' });
        console.log('휴직 신청 완료:', selectedEmployee.name);
        await fetchEmployees();
      }
    } catch (err) {
      console.error('Failed to update employee status:', err);
      setError('휴직 신청에 실패했습니다.');
    }
    setIsLeaveModalOpen(false);
    closePanel();
  };

  const handleReturnRequest = async (data: ReturnRequestData) => {
    try {
      if (selectedEmployee) {
        await employeeApi.update(selectedEmployee.id, { status: 'ACTIVE' });
        console.log('복직 신청 완료:', selectedEmployee.name);
        await fetchEmployees();
      }
    } catch (err) {
      console.error('Failed to update employee status:', err);
      setError('복직 신청에 실패했습니다.');
    }
    setIsReturnModalOpen(false);
    closePanel();
  };

  const handleResignationRequest = async (data: ResignationRequestData) => {
    try {
      if (selectedEmployee) {
        await employeeApi.update(selectedEmployee.id, { 
          status: 'RESIGNED',
          endDate: data.endDate 
        });
        console.log('퇴사 신청 완료:', selectedEmployee.name);
        await fetchEmployees();
      }
    } catch (err) {
      console.error('Failed to update employee status:', err);
      setError('퇴사 신청에 실패했습니다.');
    }
    setIsResignationModalOpen(false);
    closePanel();
  };

  const getStatusStyle = (status: string) => {
    const styles = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'ON_LEAVE': 'bg-yellow-100 text-yellow-800',
      'RESIGNED': 'bg-slate-200 text-slate-600',
      'INACTIVE': 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800';
  };

  const getStatusText = (status: string) => {
    const statusText = {
      'ACTIVE': '재직',
      'ON_LEAVE': '휴직',
      'RESIGNED': '퇴사',
      'INACTIVE': '비활성'
    };
    return statusText[status as keyof typeof statusText] || status;
  };

  return (
    <>
      {/* 메인 영역 */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">직원 관리</h1>
            <p className="text-slate-500 mt-1">전체 직원의 정보를 관리합니다.</p>
          </div>
          <button
            onClick={() => openPanel('new')}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" />
            </svg>
            직원 추가
          </button>
        </header>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">직원 목록을 불러오는 중...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">등록된 직원이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-left w-min">사진</th>
                    <th className="px-6 py-3 font-medium text-left">이름</th>
                    <th className="px-6 py-3 font-medium text-left">사번</th>
                    <th className="px-6 py-3 font-medium text-left">직급</th>
                    <th className="px-6 py-3 font-medium text-left">부서</th>
                    <th className="px-6 py-3 font-medium text-left">상태</th>
                    <th className="px-6 py-3 font-medium text-left">입사일</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
                      onClick={() => openPanel('view', employee)}
                    >
                      <td className="px-6 py-3">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${employee.name.charAt(0)}`}
                          alt={employee.name}
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{employee.name}</td>
                      <td className="px-6 py-4">{employee.empNo}</td>
                      <td className="px-6 py-4">{employee.position}</td>
                      <td className="px-6 py-4">{employee.department}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(employee.status)}`}>
                          {getStatusText(employee.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(employee.joinDate).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* 상세 정보 패널 */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black bg-opacity-20"
            onClick={closePanel}
          ></div>
          <div className="absolute top-0 right-0 h-full w-full max-w-3xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
            <header className="h-16 flex-shrink-0 border-b border-slate-200 flex items-center justify-between px-6">
              <h2 className="text-lg font-bold">
                {mode === 'new' ? '새 직원 추가' : '직원 정보'}
              </h2>
              <button
                onClick={closePanel}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 text-2xl"
              >
                &times;
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <EmployeeForm
                employee={selectedEmployee}
                isEditing={isEditing}
                mode={mode}
              />
            </div>
            <footer className="h-16 flex-shrink-0 bg-slate-50 border-t border-slate-200 flex items-center justify-end px-6 space-x-2">
              {/* 뷰 모드 버튼 */}
              {mode === 'view' && (
                <>
                  {selectedEmployee?.status === 'ON_LEAVE' ? (
                    <button
                      type="button"
                      onClick={() => setIsReturnModalOpen(true)}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      복직 신청
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsLeaveModalOpen(true)}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      휴직 신청
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsResignationModalOpen(true)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    퇴사 신청
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    수정
                  </button>
                </>
              )}
              
              {/* 편집 모드 버튼 */}
              {mode === 'edit' && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={saveEmployee}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    저장
                  </button>
                </>
              )}
              
              {/* 추가 모드 버튼 */}
              {mode === 'new' && (
                <>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={saveEmployee}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    등록
                  </button>
                </>
              )}
            </footer>
          </div>
        </div>
      )}

      {/* 모달들 */}
      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        employee={selectedEmployee}
        onSubmit={handleLeaveRequest}
      />

      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        employee={selectedEmployee}
        onSubmit={handleReturnRequest}
      />

      <ResignationModal
        isOpen={isResignationModalOpen}
        onClose={() => setIsResignationModalOpen(false)}
        employee={selectedEmployee}
        onSubmit={handleResignationRequest}
      />

    </>
  );
};

export default EmployeeManagement;