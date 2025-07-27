import React, { useState } from 'react';
import { Employee } from '../types/employee';
import EmployeeForm from '../components/EmployeeForm';
import LeaveModal, { LeaveRequestData } from '../components/LeaveModal';
import ReturnModal, { ReturnRequestData } from '../components/ReturnModal';
import ResignationModal, { ResignationRequestData } from '../components/ResignationModal';

const EmployeeManagement: React.FC = () => {
  const [employees] = useState<Employee[]>([
    {
      id: 1,
      name: '윤승현',
      emp_no: 'GRK-001',
      position: 'EP',
      department: 'Consulting',
      status: '재직',
      join_date: '2020-10-01',
      email: 'yoon@grk.com',
      education: [
        { school: '서울대학교', major: '컴퓨터공학', degree: '학사' }
      ],
      experience: [
        { company: '이전회사', department: 'IT', position: '선임' }
      ]
    },
    {
      id: 2,
      name: '박영훈',
      emp_no: 'GRK-002',
      position: 'PR',
      department: 'Consulting',
      status: '재직',
      join_date: '2021-04-01',
      email: 'park@grk.com'
    },
    {
      id: 3,
      name: '김민지',
      emp_no: 'GRK-003',
      position: 'Manager',
      department: 'Management',
      status: '휴직',
      join_date: '2022-10-04',
      email: 'kim@grk.com'
    },
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isResignationModalOpen, setIsResignationModalOpen] = useState(false);

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

  const saveEmployee = () => {
    console.log('Saving employee data...');
    closePanel();
  };

  const handleLeaveRequest = (data: LeaveRequestData) => {
    console.log('Leave request:', data);
    // 직원 상태를 '휴직'으로 변경
    if (selectedEmployee) {
      const updatedEmployees = employees.map(emp => 
        emp.id === selectedEmployee.id ? { ...emp, status: '휴직' as const } : emp
      );
      // TODO: setEmployees(updatedEmployees);
      console.log('휴직 신청 완료:', selectedEmployee.name);
    }
    setIsLeaveModalOpen(false);
    closePanel();
  };

  const handleReturnRequest = (data: ReturnRequestData) => {
    console.log('Return request:', data);
    // 직원 상태를 '재직'으로 변경
    if (selectedEmployee) {
      const updatedEmployees = employees.map(emp => 
        emp.id === selectedEmployee.id ? { ...emp, status: '재직' as const } : emp
      );
      // TODO: setEmployees(updatedEmployees);
      console.log('복직 신청 완료:', selectedEmployee.name);
    }
    setIsReturnModalOpen(false);
    closePanel();
  };

  const handleResignationRequest = (data: ResignationRequestData) => {
    console.log('Resignation request:', data);
    // 직원 상태를 '퇴사'로 변경
    if (selectedEmployee) {
      const updatedEmployees = employees.map(emp => 
        emp.id === selectedEmployee.id ? { ...emp, status: '퇴사' as const } : emp
      );
      // TODO: setEmployees(updatedEmployees);
      console.log('퇴사 신청 완료:', selectedEmployee.name);
    }
    setIsResignationModalOpen(false);
    closePanel();
  };

  const getStatusStyle = (status: string) => {
    const styles = {
      '재직': 'bg-green-100 text-green-800',
      '휴직': 'bg-yellow-100 text-yellow-800',
      '퇴사': 'bg-slate-200 text-slate-600'
    };
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800';
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
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-left w-min">사진</th>
                  <th className="px-6 py-3 font-medium text-left">이름</th>
                  <th className="px-6 py-3 font-medium text-left">사번</th>
                  <th className="px-6 py-3 font-medium text-left">직급</th>
                  <th className="px-6 py-3 font-medium text-left">직무</th>
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
                    <td className="px-6 py-4">{employee.emp_no}</td>
                    <td className="px-6 py-4">{employee.position}</td>
                    <td className="px-6 py-4">{employee.department}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(employee.status)}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{employee.join_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  {selectedEmployee?.status === '휴직' ? (
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