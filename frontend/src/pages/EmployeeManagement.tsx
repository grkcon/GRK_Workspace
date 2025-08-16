import React, { useState, useEffect } from 'react';
import { Employee } from '../types/employee';
import { employeeApi } from '../services/employeeApi';
import EmployeeForm, { EmployeeFormData } from '../components/EmployeeForm';
import LeaveModal, { LeaveRequestData } from '../components/LeaveModal';
import ReturnModal, { ReturnRequestData } from '../components/ReturnModal';
import ResignationModal, { ResignationRequestData } from '../components/ResignationModal';
import EmployeeDetailModal from '../components/EmployeeDetailModal';
import SortIcon from '../components/SortIcon';
import { useSort } from '../hooks/useSort';

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 부서 필터링 상태 추가
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  
  // 삭제된 직원 보기 상태 추가
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedEmployees, setDeletedEmployees] = useState<Employee[]>([]);

  // 정렬 기능 추가  
  const currentEmployees = showDeleted ? deletedEmployees : employees;
  const { sortedData: sortedEmployees, requestSort, getSortDirection } = useSort(currentEmployees);

  // 필터링된 직원 목록
  const filteredEmployees = selectedDepartment 
    ? sortedEmployees.filter(emp => emp.department === selectedDepartment)
    : sortedEmployees;

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

  const fetchDeletedEmployees = async () => {
    try {
      const data = await employeeApi.getDeleted();
      setDeletedEmployees(data);
    } catch (err) {
      console.error('Failed to fetch deleted employees:', err);
      setError('삭제된 직원 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!window.confirm('정말로 이 직원을 삭제하시겠습니까? 삭제된 직원은 나중에 복원할 수 있습니다.')) {
      return;
    }

    try {
      await employeeApi.delete(employeeId);
      await fetchEmployees();
      if (showDeleted) {
        await fetchDeletedEmployees();
      }
      closePanel();
      alert('직원이 삭제되었습니다.');
    } catch (err) {
      console.error('Failed to delete employee:', err);
      alert('직원 삭제에 실패했습니다.');
    }
  };

  const handleRestoreEmployee = async (employeeId: number) => {
    if (!window.confirm('이 직원을 복원하시겠습니까?')) {
      return;
    }

    try {
      await employeeApi.restore(employeeId);
      await fetchEmployees();
      await fetchDeletedEmployees();
      closePanel();
      alert('직원이 복원되었습니다.');
    } catch (err) {
      console.error('Failed to restore employee:', err);
      alert('직원 복원에 실패했습니다.');
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

  const saveEmployee = async (formData: EmployeeFormData) => {
    try {
      if (mode === 'new') {
        // 새 직원 생성 시 사번 필드 제거 (백엔드에서 자동 생성)
        const { empNo, ...createData } = formData;
        
        // EmployeeFormData를 CreateEmployeeDto로 변환
        const employeeData: any = {
          ...createData,
          // 숫자 필드들을 올바른 타입으로 변환
          monthlySalary: createData.monthlySalary && createData.monthlySalary.trim() !== '' ? Math.round(Number(createData.monthlySalary.toString().replace(/,/g, '')) / 12) : undefined,
          // 빈 날짜 문자열 처리
          endDate: createData.endDate && createData.endDate.trim() !== '' ? createData.endDate : undefined
        };

        // 학력 정보 처리 (빈 배열도 전송)
        employeeData.education = createData.education && createData.education.length > 0 
          ? createData.education.map(edu => ({
              school: edu.school,
              major: edu.major,
              degree: edu.degree,
              startDate: edu.startDate && edu.startDate.trim() !== '' ? edu.startDate : undefined,
              graduationDate: edu.graduationDate && edu.graduationDate.trim() !== '' ? edu.graduationDate : undefined
            }))
          : [];

        // 경력 정보 처리 (빈 배열도 전송)
        employeeData.experience = createData.experience && createData.experience.length > 0
          ? createData.experience.map(exp => ({
              company: exp.company,
              department: exp.department,
              position: exp.position,
              startDate: exp.startDate && exp.startDate.trim() !== '' ? exp.startDate : undefined,
              endDate: exp.endDate && exp.endDate.trim() !== '' ? exp.endDate : undefined,
              annualSalary: exp.annualSalary && exp.annualSalary.trim() !== '' ? Number(exp.annualSalary.toString().replace(/,/g, '')) : undefined
            }))
          : [];
        
        console.log('Creating new employee...');
        console.log('Original form data:', formData);
        console.log('Processed employee data:', employeeData);
        console.log('Employee data keys:', Object.keys(employeeData));
        console.log('Employee data JSON:', JSON.stringify(employeeData, null, 2));
        
        await employeeApi.create(employeeData);
        console.log('Employee created successfully');
      } else if (mode === 'edit' && selectedEmployee) {
        console.log('Updating employee...', formData);
        console.log('Selected employee ID:', selectedEmployee.id);
        
        // 수정 시에는 모든 데이터를 보내되, 기존 상태 유지
        const updateData: any = {
          ...formData,
          status: selectedEmployee.status, // 기존 상태 유지
          // 숫자 필드들을 올바른 타입으로 변환
          monthlySalary: formData.monthlySalary && formData.monthlySalary.trim() !== '' ? Math.round(Number(formData.monthlySalary.toString().replace(/,/g, '')) / 12) : undefined,
          // 빈 날짜 문자열 처리
          endDate: formData.endDate && formData.endDate.trim() !== '' ? formData.endDate : undefined
        };

        // 학력 정보 처리 (빈 배열도 전송)
        updateData.education = formData.education && formData.education.length > 0
          ? formData.education.map(edu => ({
              school: edu.school,
              major: edu.major,
              degree: edu.degree,
              startDate: edu.startDate && edu.startDate.trim() !== '' ? edu.startDate : undefined,
              graduationDate: edu.graduationDate && edu.graduationDate.trim() !== '' ? edu.graduationDate : undefined
            }))
          : [];

        // 경력 정보 처리 (빈 배열도 전송)
        updateData.experience = formData.experience && formData.experience.length > 0
          ? formData.experience.map(exp => ({
              company: exp.company,
              department: exp.department,
              position: exp.position,
              startDate: exp.startDate && exp.startDate.trim() !== '' ? exp.startDate : undefined,
              endDate: exp.endDate && exp.endDate.trim() !== '' ? exp.endDate : undefined,
              annualSalary: exp.annualSalary && exp.annualSalary.trim() !== '' ? Number(exp.annualSalary.toString().replace(/,/g, '')) : undefined
            }))
          : [];
        
        await employeeApi.update(selectedEmployee.id, updateData);
        console.log('Employee updated successfully');
      }
      closePanel();
      await fetchEmployees(); // Refresh the list
    } catch (err) {
      console.error('Failed to save employee:', err);
      console.error('Error details:', err);
      
      // 에러 메시지 분석 및 사용자 친화적 메시지 생성
      let errorMessage = '직원 정보 저장에 실패했습니다.';
      
      if (err instanceof Error) {
        if (err.message.includes('column employee.education does not exist')) {
          errorMessage = '데이터베이스 스키마 오류: education 컬럼이 존재하지 않습니다. 개발자에게 문의하세요.';
        } else if (err.message.includes('column employee.experience does not exist')) {
          errorMessage = '데이터베이스 스키마 오류: experience 컬럼이 존재하지 않습니다. 개발자에게 문의하세요.';
        } else if (err.message.includes('property age should not exist')) {
          errorMessage = '데이터 오류: 나이 필드가 포함되어 있습니다. 페이지를 새로고침 후 다시 시도하세요.';
        } else if (err.message.includes('Bad Request')) {
          errorMessage = `입력 데이터 오류: ${err.message}`;
        } else {
          errorMessage = `오류: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      
      // 브라우저 알림도 표시
      alert(errorMessage);
    }
  };

  const handleLeaveRequest = async (data: LeaveRequestData) => {
    try {
      if (selectedEmployee) {
        // 새로운 휴직 신청 API 호출
        await employeeApi.processLeaveRequest(selectedEmployee.id, {
          startDate: data.startDate,
          returnDate: data.returnDate,
          reason: data.reason,
          payType: data.payType,
          memo: data.memo
        });
        console.log('휴직 신청 완료:', selectedEmployee.name);
        await fetchEmployees();
        alert('휴직 신청이 성공적으로 처리되었습니다.');
      }
    } catch (err) {
      console.error('Failed to process leave request:', err);
      alert('휴직 신청에 실패했습니다.');
    }
    setIsLeaveModalOpen(false);
    closePanel();
  };

  const handleReturnRequest = async (data: ReturnRequestData) => {
    try {
      if (selectedEmployee) {
        // 새로운 복직 처리 API 호출
        await employeeApi.processReturnFromLeave(selectedEmployee.id);
        console.log('복직 신청 완료:', selectedEmployee.name);
        await fetchEmployees();
        alert('복직이 성공적으로 처리되었습니다.');
      }
    } catch (err) {
      console.error('Failed to process return request:', err);
      alert('복직 처리에 실패했습니다.');
    }
    setIsReturnModalOpen(false);
    closePanel();
  };

  const handleResignationRequest = async (data: ResignationRequestData) => {
    try {
      if (selectedEmployee) {
        // 새로운 퇴사 신청 API 호출
        await employeeApi.processResignationRequest(selectedEmployee.id, {
          resignDate: data.resignDate,
          reason: data.reason,
          leaveAccrued: data.leaveAccrued,
          leaveUsed: data.leaveUsed,
          leaveRemaining: data.leaveRemaining,
          leaveAllowance: data.leaveAllowance,
          severancePay: data.severancePay,
          memo: data.memo
        });
        console.log('퇴사 신청 완료:', selectedEmployee.name);
        await fetchEmployees();
        alert('퇴사 신청이 성공적으로 처리되었습니다.');
      }
    } catch (err) {
      console.error('Failed to process resignation request:', err);
      alert('퇴사 신청에 실패했습니다.');
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

  const getDepartmentStats = () => {
    const departmentCounts: { [key: string]: number } = {};
    
    sortedEmployees.forEach(employee => {
      const dept = employee.department || '미정';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    return Object.entries(departmentCounts)
      .map(([department, count]) => ({ 
        department, 
        count,
        isSelected: selectedDepartment === department
      }))
      .sort((a, b) => b.count - a.count); // 직원수 많은 순으로 정렬
  };

  const handleDepartmentFilter = (department: string) => {
    if (selectedDepartment === department) {
      // 이미 선택된 부서를 클릭하면 필터 해제
      setSelectedDepartment(null);
    } else {
      // 새로운 부서 선택
      setSelectedDepartment(department);
    }
  };

  const toggleDeletedView = async () => {
    if (!showDeleted) {
      // 삭제된 직원들을 보여주기 전에 데이터 로드
      await fetchDeletedEmployees();
    }
    setShowDeleted(!showDeleted);
    setSelectedDepartment(null); // 필터 초기화
  };

  return (
    <>
      {/* 메인 영역 */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">직원 관리</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-500">
                {showDeleted
                  ? selectedDepartment 
                    ? `${selectedDepartment} 부서의 삭제된 직원을 관리합니다.` 
                    : '삭제된 직원들을 관리합니다.'
                  : selectedDepartment 
                    ? `${selectedDepartment} 부서의 직원을 관리합니다.` 
                    : '전체 직원의 정보를 관리합니다.'
                }
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {selectedDepartment ? `${filteredEmployees.length}명` : `총 ${sortedEmployees.length}명`}
                  {selectedDepartment && (
                    <button
                      onClick={() => setSelectedDepartment(null)}
                      className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                      title="필터 해제"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </span>
                {getDepartmentStats().map((stat, index) => (
                  <button
                    key={index}
                    onClick={() => handleDepartmentFilter(stat.department)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer hover:bg-slate-200 ${
                      stat.isSelected 
                        ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}
                    title={`${stat.department} 부서만 보기`}
                  >
                    {stat.department} {stat.count}명
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDeletedView}
              className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center ${
                showDeleted
                  ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 focus:ring-slate-500'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                {showDeleted ? (
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                )}
              </svg>
              {showDeleted ? '활성 직원 보기' : '삭제된 직원 보기'}
            </button>
            {!showDeleted && (
              <>
                <button
                  onClick={() => openPanel('new')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" />
                  </svg>
                  직원 추가
                </button>
              </>
            )}
          </div>
        </header>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">직원 목록을 불러오는 중...</p>
            </div>
          ) : currentEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showDeleted ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  )}
                </svg>
              </div>
              <p className="text-slate-500 text-lg font-medium mb-2">
                {showDeleted ? '삭제된 직원이 없습니다' : '등록된 직원이 없습니다'}
              </p>
              <p className="text-slate-400 text-sm">
                {showDeleted ? '삭제된 직원들이 여기에 표시됩니다.' : '새 직원을 추가해서 시작해보세요.'}
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600">
                  총 0명
                </span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-left w-min">사진</th>
                    <th className="px-6 py-3 font-medium text-left">
                      <button
                        className="group flex items-center space-x-1 hover:text-slate-700 transition-colors"
                        onClick={() => requestSort('name')}
                      >
                        <span>이름</span>
                        <SortIcon direction={getSortDirection('name')} />
                      </button>
                    </th>
                    <th className="px-6 py-3 font-medium text-left">
                      <button
                        className="group flex items-center space-x-1 hover:text-slate-700 transition-colors"
                        onClick={() => requestSort('empNo')}
                      >
                        <span>사번</span>
                        <SortIcon direction={getSortDirection('empNo')} />
                      </button>
                    </th>
                    <th className="px-6 py-3 font-medium text-left">직급</th>
                    <th className="px-6 py-3 font-medium text-left">
                      <button
                        className="group flex items-center space-x-1 hover:text-slate-700 transition-colors"
                        onClick={() => requestSort('department')}
                      >
                        <span>부서</span>
                        <SortIcon direction={getSortDirection('department')} />
                      </button>
                    </th>
                    <th className="px-6 py-3 font-medium text-left">
                      <button
                        className="group flex items-center space-x-1 hover:text-slate-700 transition-colors"
                        onClick={() => requestSort('status')}
                      >
                        <span>상태</span>
                        <SortIcon direction={getSortDirection('status')} />
                      </button>
                    </th>
                    <th className="px-6 py-3 font-medium text-left">
                      <button
                        className="group flex items-center space-x-1 hover:text-slate-700 transition-colors"
                        onClick={() => requestSort('joinDate')}
                      >
                        <span>입사일</span>
                        <SortIcon direction={getSortDirection('joinDate')} />
                      </button>
                    </th>
                    <th className="px-6 py-3 font-medium text-center">작업</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className={`border-t border-slate-200 hover:bg-slate-50 cursor-pointer ${
                        showDeleted ? 'bg-red-50 opacity-75' : ''
                      }`}
                      onClick={() => openPanel('view', employee)}
                    >
                      <td className="px-6 py-3">
                        <img
                          className="h-10 w-10 rounded-full object-cover border border-slate-200"
                          src={employee.profileImageUrl 
                            ? `http://localhost:3001${employee.profileImageUrl}` 
                            : `https://placehold.co/40x40/E2E8F0/4A5568?text=${employee.name.charAt(0)}`
                          }
                          alt={employee.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://placehold.co/40x40/E2E8F0/4A5568?text=${employee.name.charAt(0)}`;
                          }}
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
                onSubmit={saveEmployee}
                onCancel={closePanel}
              />
            </div>
            {/* 뷰 모드일 때만 footer 표시 */}
            {mode === 'view' && (
              <footer className="h-16 flex-shrink-0 bg-slate-50 border-t border-slate-200 flex items-center justify-end px-6 space-x-2">
                {showDeleted ? (
                  // 삭제된 직원 보기 모드일 때 복원 버튼
                  <button
                    type="button"
                    onClick={() => selectedEmployee && handleRestoreEmployee(selectedEmployee.id)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    복원
                  </button>
                ) : (
                  // 일반 모드일 때 기존 버튼들
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
                      onClick={() => selectedEmployee && handleDeleteEmployee(selectedEmployee.id)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                    >
                      삭제
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
              </footer>
            )}
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