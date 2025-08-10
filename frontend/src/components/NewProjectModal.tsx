import React, { useState, useEffect } from 'react';
import { Project, ProjectPayment, InternalStaff, ExternalStaff, OpexItem } from '../types/ppe';
import { employeeApi } from '../services/employeeApi';
import { Employee } from '../types/employee';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => void;
}


const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSave }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    client: '',
    startDate: '',
    endDate: '',
    pm: '',
    contractValue: 0,
    status: '계획'
  });

  const [payment, setPayment] = useState<ProjectPayment>({
    downPayment: 0,
    middlePayment: 0,
    finalPayment: 0
  });

  const [paymentPercent, setPaymentPercent] = useState({
    down: 30,
    middle: 40,
    final: 30
  });

  const [internalStaff, setInternalStaff] = useState<InternalStaff[]>([]);
  const [externalStaff, setExternalStaff] = useState<ExternalStaff[]>([]);
  const [indirectOpex, setIndirectOpex] = useState<OpexItem[]>([]);
  const [directOpex, setDirectOpex] = useState<OpexItem[]>([]);

  // 재직자 리스트 가져오기
  useEffect(() => {
    const fetchEmployees = async () => {
      if (isOpen) {
        setLoadingEmployees(true);
        try {
          const activeEmployees = await employeeApi.getActive();
          setEmployees(activeEmployees);
        } catch (error) {
          console.error('Failed to fetch employees:', error);
          // 실패 시 기존 hrMaster 사용
          setEmployees([]);
        } finally {
          setLoadingEmployees(false);
        }
      }
    };

    fetchEmployees();
  }, [isOpen]);

  useEffect(() => {
    calculatePayment();
  }, [formData.contractValue, paymentPercent]);

  const calculatePayment = () => {
    const total = formData.contractValue || 0;
    setPayment({
      downPayment: total * (paymentPercent.down / 100),
      middlePayment: total * (paymentPercent.middle / 100),
      finalPayment: total * (paymentPercent.final / 100)
    });
  };

  const updatePayment = (field: keyof ProjectPayment, value: number) => {
    setPayment({
      ...payment,
      [field]: value
    });
  };

  const calculateStaffCost = (staff: InternalStaff): number => {
    if (!staff.startDate || !staff.endDate) return 0;
    
    // 실제 직원 데이터에서 찾기
    const employee = employees.find(emp => emp.id === staff.hrId);
    let monthlyCost = 0;
    
    if (employee) {
      // HR Cost에서 월 인력비 가져오기 (현재 연도 기준)
      const currentYear = new Date().getFullYear();
      const hrCost = employee.hrCosts?.find(cost => cost.year === currentYear);
      
      if (hrCost && hrCost.monthlyLaborCost) {
        monthlyCost = hrCost.monthlyLaborCost;
      } else if (employee.monthlySalary) {
        // HR Cost가 없으면 기존 월급 사용
        monthlyCost = employee.monthlySalary;
      }
    }
    

    if (monthlyCost === 0) return 0;

    const start = new Date(staff.startDate);
    const end = new Date(staff.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const workingDays = diffDays - staff.exclusionDays;
    const months = (workingDays / 30.4) * (staff.utilization / 100);
    
    return months * monthlyCost;
  };

  const addInternalStaff = () => {
    if (employees.length > 0) {
      const firstEmployee = employees[0];
      setInternalStaff([...internalStaff, {
        hrId: firstEmployee.id,
        name: firstEmployee.name,
        role: '',
        startDate: '',
        endDate: '',
        utilization: 100,
        exclusionDays: 0,
        totalCost: 0
      }]);
    }
  };

  // 투입율 자동 계산 함수
  const calculateUtilization = (startDate: string, endDate: string, exclusionDays: number): number => {
    if (!startDate || !endDate) return 100;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 주말을 제외한 영업일 계산
    let totalWorkDays = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // 주말(토요일:6, 일요일:0)을 제외
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalWorkDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    // 투입제외일을 뺀 실제 투입일수
    const actualWorkDays = totalWorkDays - exclusionDays;
    
    // 투입율 = (실제 투입일수 / 전체 영업일수) * 100
    const utilization = totalWorkDays > 0 ? (actualWorkDays / totalWorkDays) * 100 : 100;
    
    // 0보다 작거나 100보다 큰 값 방지
    return Math.max(0, Math.min(100, Math.round(utilization * 100) / 100));
  };

  const updateInternalStaff = (index: number, field: keyof InternalStaff, value: any) => {
    const updated = [...internalStaff];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'hrId') {
      // 실제 직원 데이터에서 찾기
      const employee = employees.find(emp => emp.id === value);
      if (employee) {
        updated[index].name = employee.name;
        
        // HR Cost에서 월 인력비 가져오기 (현재 연도 기준)
        const currentYear = new Date().getFullYear();
        const hrCost = employee.hrCosts?.find(cost => cost.year === currentYear);
        
        if (hrCost && hrCost.monthlyLaborCost) {
          updated[index].monthlyCost = hrCost.monthlyLaborCost;
        } else if (employee.monthlySalary) {
          // HR Cost가 없으면 기존 월급 사용
          updated[index].monthlyCost = employee.monthlySalary;
        } else {
          updated[index].monthlyCost = 0;
        }
      }
    }
    
    // 날짜나 제외일이 변경되면 투입율 자동 계산
    if (field === 'startDate' || field === 'endDate' || field === 'exclusionDays') {
      const { startDate, endDate, exclusionDays } = updated[index];
      updated[index].utilization = calculateUtilization(
        startDate, 
        endDate, 
        exclusionDays || 0
      );
    }
    
    // 투입율, 날짜, 제외일, 직원 변경 시 총 투입원가 자동 재계산
    updated[index].totalCost = calculateStaffCost(updated[index]);
    setInternalStaff(updated);
  };

  const removeInternalStaff = (index: number) => {
    setInternalStaff(internalStaff.filter((_, i) => i !== index));
  };

  const addExternalStaff = () => {
    setExternalStaff([...externalStaff, {
      name: '',
      role: '',
      contact: '',
      period: '',
      cost: 0,
      memo: ''
    }]);
  };

  const updateExternalStaff = (index: number, field: keyof ExternalStaff, value: any) => {
    const updated = [...externalStaff];
    updated[index] = { ...updated[index], [field]: value };
    setExternalStaff(updated);
  };

  const removeExternalStaff = (index: number) => {
    setExternalStaff(externalStaff.filter((_, i) => i !== index));
  };

  const addOpexItem = (type: 'indirect' | 'direct') => {
    const newItem: OpexItem = { category: '', amount: 0, note: '' };
    if (type === 'indirect') {
      setIndirectOpex([...indirectOpex, newItem]);
    } else {
      setDirectOpex([...directOpex, newItem]);
    }
  };

  const updateOpexItem = (type: 'indirect' | 'direct', index: number, field: keyof OpexItem, value: any) => {
    const items = type === 'indirect' ? [...indirectOpex] : [...directOpex];
    items[index] = { ...items[index], [field]: value };
    
    if (type === 'indirect') {
      setIndirectOpex(items);
    } else {
      setDirectOpex(items);
    }
  };

  const removeOpexItem = (type: 'indirect' | 'direct', index: number) => {
    if (type === 'indirect') {
      setIndirectOpex(indirectOpex.filter((_, i) => i !== index));
    } else {
      setDirectOpex(directOpex.filter((_, i) => i !== index));
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const resetData = () => {
    setFormData({
      name: '',
      client: '',
      startDate: '',
      endDate: '',
      pm: '',
      contractValue: 0,
      status: '계획'
    });
    setPayment({ downPayment: 0, middlePayment: 0, finalPayment: 0 });
    setPaymentPercent({ down: 30, middle: 40, final: 30 });
    setInternalStaff([]);
    setExternalStaff([]);
    setIndirectOpex([]);
    setDirectOpex([]);
  };

  const handleClose = () => {
    resetData();
    onClose();
  };

  const handleSave = () => {
    // 완전한 프로젝트 데이터 구성
    const projectData = {
      ...formData,
      projectPayment: payment,
      internalStaff: internalStaff.map(staff => ({
        name: staff.name,
        role: staff.role,
        startDate: staff.startDate,
        endDate: staff.endDate,
        utilization: staff.utilization,
        exclusionDays: staff.exclusionDays,
        totalCost: staff.totalCost,
        monthlyCost: staff.monthlyCost,
        employeeId: staff.hrId // 직원 ID 매핑
      })),
      externalStaff: externalStaff,
      indirectOpex: indirectOpex,
      directOpex: directOpex
    };
    
    onSave(projectData);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30">
      <div 
        className="absolute inset-0 bg-black bg-opacity-20"
        onClick={handleClose}
      ></div>
      <div className={`absolute top-0 right-0 h-full w-full max-w-5xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg">새 프로젝트 추가</h3>
        </header>
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2">
                <label className="block font-medium text-slate-600 mb-1">프로젝트명</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">시작일</label>
                <input 
                  type="date" 
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">종료일</label>
                <input 
                  type="date" 
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">거래처</label>
                <input 
                  type="text" 
                  value={formData.client}
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">담당 PM</label>
                <select 
                  value={formData.pm}
                  onChange={(e) => setFormData({...formData, pm: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md"
                >
                  <option value="">선택</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">계약금액</label>
                <input 
                  type="number" 
                  value={formData.contractValue}
                  onChange={(e) => setFormData({...formData, contractValue: parseInt(e.target.value) || 0})}
                  placeholder="총 계약금액(원)"
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">상태</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as '진행중' | '완료' | '계획'})}
                  className="w-full p-2 border border-slate-300 rounded-md"
                >
                  <option value="계획">계획</option>
                  <option value="진행중">진행중</option>
                  <option value="완료">완료</option>
                </select>
              </div>
            </section>

            {/* 계약금 관리 */}
            <section className="space-y-2">
              <label className="block font-medium text-slate-600">계약금 관리</label>
              <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-md items-center">
                <span>계약금</span>
                <input type="date" className="w-full p-1 border rounded-md" />
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={paymentPercent.down}
                    onChange={(e) => setPaymentPercent({...paymentPercent, down: parseInt(e.target.value) || 0})}
                    className="w-16 p-1 border rounded-md"
                  />
                  <span className="ml-1">%</span>
                </div>
                <input 
                  type="number" 
                  value={payment.downPayment}
                  onChange={(e) => updatePayment('downPayment', parseInt(e.target.value) || 0)}
                  className="w-full p-1 border rounded-md"
                  placeholder="금액"
                />
              </div>
              <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-md items-center">
                <span>중도금</span>
                <input type="date" className="w-full p-1 border rounded-md" />
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={paymentPercent.middle}
                    onChange={(e) => setPaymentPercent({...paymentPercent, middle: parseInt(e.target.value) || 0})}
                    className="w-16 p-1 border rounded-md"
                  />
                  <span className="ml-1">%</span>
                </div>
                <input 
                  type="number" 
                  value={payment.middlePayment}
                  onChange={(e) => updatePayment('middlePayment', parseInt(e.target.value) || 0)}
                  className="w-full p-1 border rounded-md"
                  placeholder="금액"
                />
              </div>
              <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-md items-center">
                <span>잔금</span>
                <input type="date" className="w-full p-1 border rounded-md" />
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={paymentPercent.final}
                    onChange={(e) => setPaymentPercent({...paymentPercent, final: parseInt(e.target.value) || 0})}
                    className="w-16 p-1 border rounded-md"
                  />
                  <span className="ml-1">%</span>
                </div>
                <input 
                  type="number" 
                  value={payment.finalPayment}
                  onChange={(e) => updatePayment('finalPayment', parseInt(e.target.value) || 0)}
                  className="w-full p-1 border rounded-md"
                  placeholder="금액"
                />
              </div>
            </section>

            {/* 투입인력 */}
            <section>
              <label className="block font-medium text-slate-600">투입인력</label>
              <div className="mt-1 border rounded-lg overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr className="text-left">
                      <th className="p-2 font-medium">이름</th>
                      <th className="p-2 font-medium">담당업무</th>
                      <th className="p-2 font-medium">투입시작일</th>
                      <th className="p-2 font-medium">투입종료일</th>
                      <th className="p-2 font-medium">투입율(%)</th>
                      <th className="p-2 font-medium">투입제외일(일)</th>
                      <th className="p-2 font-medium text-right">총 투입원가</th>
                      <th className="w-12 p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {internalStaff.map((staff, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-1">
                          <select 
                            value={staff.hrId}
                            onChange={(e) => updateInternalStaff(index, 'hrId', parseInt(e.target.value))}
                            className="w-full border-0 rounded-md"
                          >
                            {loadingEmployees ? (
                              <option>로딩 중...</option>
                            ) : (
                              <>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.name} ({emp.empNo}) - {emp.position}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.role}
                            onChange={(e) => updateInternalStaff(index, 'role', e.target.value)}
                            placeholder="담당업무"
                            className="w-full border-0 rounded-md"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="date" 
                            value={staff.startDate}
                            onChange={(e) => updateInternalStaff(index, 'startDate', e.target.value)}
                            className="w-full border-0 rounded-md"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="date" 
                            value={staff.endDate}
                            onChange={(e) => updateInternalStaff(index, 'endDate', e.target.value)}
                            className="w-full border-0 rounded-md"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="number" 
                            value={staff.utilization}
                            onChange={(e) => updateInternalStaff(index, 'utilization', parseFloat(e.target.value) || 0)}
                            className="w-full border-0 rounded-md text-right"
                            step="0.01"
                            title="날짜와 제외일 입력 시 자동 계산되지만 수정 가능합니다"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="number" 
                            value={staff.exclusionDays}
                            onChange={(e) => updateInternalStaff(index, 'exclusionDays', parseInt(e.target.value) || 0)}
                            className="w-full border-0 rounded-md text-right"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={formatCurrency(staff.totalCost)}
                            className="w-full border-0 rounded-md bg-slate-100 text-right"
                            readOnly
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button 
                            type="button" 
                            onClick={() => removeInternalStaff(index)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button 
                  type="button" 
                  onClick={addInternalStaff}
                  className="w-full text-center p-2 text-indigo-600 hover:bg-indigo-50"
                >
                  + 인력 추가
                </button>
              </div>
            </section>

            {/* 외부인력 */}
            <section>
              <label className="block font-medium text-slate-600">외부인력 (프리랜서)</label>
              <div className="mt-1 border rounded-lg overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr className="text-left">
                      <th className="p-2 font-medium">이름</th>
                      <th className="p-2 font-medium">담당업무</th>
                      <th className="p-2 font-medium">연락처</th>
                      <th className="p-2 font-medium">투입기간</th>
                      <th className="p-2 font-medium">외주금액</th>
                      <th className="p-2 font-medium">메모</th>
                      <th className="p-2 font-medium">첨부서류</th>
                      <th className="w-12 p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {externalStaff.map((staff, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.name}
                            onChange={(e) => updateExternalStaff(index, 'name', e.target.value)}
                            placeholder="이름"
                            className="w-full border-0 rounded-md"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.role}
                            onChange={(e) => updateExternalStaff(index, 'role', e.target.value)}
                            placeholder="담당업무"
                            className="w-full border-0 rounded-md"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.contact}
                            onChange={(e) => updateExternalStaff(index, 'contact', e.target.value)}
                            placeholder="연락처"
                            className="w-full border-0 rounded-md"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.period}
                            onChange={(e) => updateExternalStaff(index, 'period', e.target.value)}
                            placeholder="YYYY.MM.DD ~ YYYY.MM.DD"
                            className="w-full border-0 rounded-md"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="number" 
                            value={staff.cost}
                            onChange={(e) => updateExternalStaff(index, 'cost', parseInt(e.target.value) || 0)}
                            placeholder="금액"
                            className="w-full border-0 rounded-md text-right"
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.memo}
                            onChange={(e) => updateExternalStaff(index, 'memo', e.target.value)}
                            placeholder="메모"
                            className="w-full border-0 rounded-md"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button type="button" className="text-xs text-indigo-600 hover:underline">
                            파일첨부
                          </button>
                        </td>
                        <td className="p-1 text-center">
                          <button 
                            type="button" 
                            onClick={() => removeExternalStaff(index)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button 
                  type="button" 
                  onClick={addExternalStaff}
                  className="w-full text-center p-2 text-indigo-600 hover:bg-indigo-50"
                >
                  + 외부인력 추가
                </button>
              </div>
            </section>

            {/* Opex */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium text-slate-600">Indirect Opex</label>
                <div className="mt-1 border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr className="text-left">
                        <th className="p-2 font-medium">항목</th>
                        <th className="p-2 font-medium">금액</th>
                        <th className="p-2 font-medium">비고</th>
                        <th className="w-12 p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {indirectOpex.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={item.category}
                              onChange={(e) => updateOpexItem('indirect', index, 'category', e.target.value)}
                              placeholder="항목명"
                              className="w-full border-0 rounded-md"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="number" 
                              value={item.amount}
                              onChange={(e) => updateOpexItem('indirect', index, 'amount', parseInt(e.target.value) || 0)}
                              placeholder="금액"
                              className="w-full border-0 rounded-md text-right"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={item.note}
                              onChange={(e) => updateOpexItem('indirect', index, 'note', e.target.value)}
                              placeholder="비고"
                              className="w-full border-0 rounded-md"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <button 
                              type="button" 
                              onClick={() => removeOpexItem('indirect', index)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button 
                    type="button" 
                    onClick={() => addOpexItem('indirect')}
                    className="w-full text-center p-2 text-indigo-600 hover:bg-indigo-50"
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-600">Direct Opex</label>
                <div className="mt-1 border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr className="text-left">
                        <th className="p-2 font-medium">항목</th>
                        <th className="p-2 font-medium">금액</th>
                        <th className="p-2 font-medium">비고</th>
                        <th className="w-12 p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {directOpex.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={item.category}
                              onChange={(e) => updateOpexItem('direct', index, 'category', e.target.value)}
                              placeholder="항목명"
                              className="w-full border-0 rounded-md"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="number" 
                              value={item.amount}
                              onChange={(e) => updateOpexItem('direct', index, 'amount', parseInt(e.target.value) || 0)}
                              placeholder="금액"
                              className="w-full border-0 rounded-md text-right"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={item.note}
                              onChange={(e) => updateOpexItem('direct', index, 'note', e.target.value)}
                              placeholder="비고"
                              className="w-full border-0 rounded-md"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <button 
                              type="button" 
                              onClick={() => removeOpexItem('direct', index)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button 
                    type="button" 
                    onClick={() => addOpexItem('direct')}
                    className="w-full text-center p-2 text-indigo-600 hover:bg-indigo-50"
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
        <footer className="p-4 bg-slate-50 flex justify-end space-x-2">
          <button 
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            저장
          </button>
        </footer>
      </div>
    </div>
  );
};

export default NewProjectModal;