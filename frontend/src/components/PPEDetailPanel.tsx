import React, { useState, useEffect } from 'react';
import { Project as FrontendProject, ProjectPPE, ProjectPayment, InternalStaff, ExternalStaff, OpexItem, HRMaster } from '../types/ppe';
import { Project as BackendProject } from '../services/projectApi';

interface PPEDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  project?: BackendProject;
  ppeData?: ProjectPPE;
  onSave: (updatedData: ProjectPPE) => void;
}

// 임시 HR 마스터 데이터 (NewProjectModal과 동일)
const hrMaster: HRMaster[] = [
  { hrId: 1, name: '윤승현', monthlyCost: 23391667 },
  { hrId: 2, name: '박영훈', monthlyCost: 16783333 },
];

const PPEDetailPanel: React.FC<PPEDetailPanelProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  ppeData,
  onSave 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localPPEData, setLocalPPEData] = useState<ProjectPPE | null>(null);
  
  // NewProjectModal과 동일한 상태 관리 추가
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

  useEffect(() => {
    if (ppeData) {
      setLocalPPEData({ ...ppeData });
      
      // API로부터 받은 확장된 Project 데이터를 사용해 상태 업데이트
      if (ppeData.project) {
        // Payment 정보
        if (ppeData.project.projectPayment) {
          setPayment({
            downPayment: ppeData.project.projectPayment.downPayment || 0,
            middlePayment: ppeData.project.projectPayment.middlePayment || 0,
            finalPayment: ppeData.project.projectPayment.finalPayment || 0
          });
        }
        
        // Internal Staff 정보
        if (ppeData.project.internalStaff) {
          setInternalStaff(ppeData.project.internalStaff.map((staff: any) => ({
            id: staff.id,
            hrId: staff.id || 1, // API 구조에 맞게 조정 필요
            name: staff.name,
            role: staff.role,
            startDate: staff.startDate,
            endDate: staff.endDate,
            utilization: staff.utilization,
            exclusionDays: staff.exclusionDays,
            totalCost: staff.totalCost,
            monthlyCost: 0 // 필요시 계산
          })));
        }
        
        // External Staff 정보
        if (ppeData.project.externalStaff) {
          setExternalStaff(ppeData.project.externalStaff.map((staff: any) => ({
            id: staff.id,
            name: staff.name,
            role: staff.role,
            contact: staff.contact,
            period: staff.period,
            cost: staff.cost,
            memo: staff.memo
          })));
        }
      }
      
      // OPEX 정보
      if (ppeData.indirectOpex) {
        setIndirectOpex(ppeData.indirectOpex.map((opex: any) => ({
          id: opex.id,
          category: opex.category,
          amount: opex.amount,
          note: opex.note || ''
        })));
      }
      
      if (ppeData.directOpex) {
        setDirectOpex(ppeData.directOpex.map((opex: any) => ({
          id: opex.id,
          category: opex.category,
          amount: opex.amount,
          note: opex.note || ''
        })));
      }
      
      // 기존 PPE 데이터에서 payment 정보 설정 (fallback)
      if (ppeData.payment && !ppeData.project?.projectPayment) {
        setPayment({
          downPayment: ppeData.payment.downPayment,
          middlePayment: ppeData.payment.middlePayment,
          finalPayment: ppeData.payment.finalPayment
        });
      }
    } else if (project) {
      // 초기 PPE 데이터 생성
      const contractAmount = typeof project.contractValue === 'string' ? parseFloat(project.contractValue) : project.contractValue;
      const initialPPE: ProjectPPE = {
        id: 0, // 임시 ID
        revenue: contractAmount,
        laborCost: 57330000, // 샘플 데이터
        outsourcingCost: 0,
        opexCost: 3000000,
        grossIncome: 0,
        grossIncomeRate: 0,
        operationIncome: 0,
        operationIncomeRate: 0,
        profit: 0,
        profitRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        project: {
          id: project.id,
          name: project.name,
          startDate: typeof project.startDate === 'string' ? project.startDate : project.startDate.toISOString().split('T')[0],
          endDate: typeof project.endDate === 'string' ? project.endDate : project.endDate.toISOString().split('T')[0],
          status: project.status,
          contractAmount: contractAmount,
          projectClient: {
            id: 0,
            companyName: project.client,
            contactPerson: '김철수 부장',
            contactNumber: '010-1234-5678',
            email: 'sample@example.com',
          },
        },
        payment: {
          downPayment: contractAmount * 0.3,
          middlePayment: contractAmount * 0.4,
          finalPayment: contractAmount * 0.3,
        },
        client: {
          name: project.client,
          contactPerson: '김철수 부장',
          contactNumber: '010-1234-5678'
        }
      };
      calculateIncome(initialPPE);
      setLocalPPEData(initialPPE);
      
      // 초기 payment 상태 설정
      setPayment({
        downPayment: contractAmount * 0.3,
        middlePayment: contractAmount * 0.4,
        finalPayment: contractAmount * 0.3
      });
    }
  }, [project, ppeData]);

  // 계약금액이나 비율 변경 시 계산
  useEffect(() => {
    calculatePayment();
  }, [localPPEData?.revenue, paymentPercent]);

  const calculateIncome = (data: ProjectPPE) => {
    data.grossIncome = data.revenue - data.laborCost - data.outsourcingCost;
    data.grossIncomeRate = (data.grossIncome / data.revenue) * 100;
    data.operationIncome = data.grossIncome - data.opexCost;
    data.operationIncomeRate = (data.operationIncome / data.revenue) * 100;
    data.profit = data.operationIncome * 0.8; // 세금 등 20% 가정
    data.profitRate = (data.profit / data.revenue) * 100;
  };

  const handleInputChange = (field: keyof ProjectPPE | string, value: string) => {
    if (!localPPEData) return;

    const updatedData = { ...localPPEData };
    
    if (field.includes('.')) {
      // nested object handling (payment.downPayment 등)
      const [parent, child] = field.split('.');
      if (parent === 'payment' && updatedData.payment) {
        updatedData.payment = {
          ...updatedData.payment,
          [child]: parseInt(value.replace(/,/g, ''), 10) || 0
        };
      } else if (parent === 'client' && updatedData.client) {
        updatedData.client = {
          ...updatedData.client,
          [child]: value
        };
      }
    } else {
      // direct field
      const numericFields = ['revenue', 'laborCost', 'outsourcingCost', 'opexCost'];
      if (numericFields.includes(field)) {
        (updatedData as any)[field] = parseInt(value.replace(/,/g, ''), 10) || 0;
        calculateIncome(updatedData);
      }
    }
    
    setLocalPPEData(updatedData);
  };

  const handleSave = () => {
    if (localPPEData) {
      // 모든 관련 데이터를 포함한 업데이트된 PPE 데이터 생성
      const updatedPPEData: ProjectPPE = {
        ...localPPEData,
        payment,
        internalStaff,
        externalStaff,
        indirectOpex,
        directOpex
      };
      
      onSave(updatedPPEData);
      setIsEditing(false);
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  // NewProjectModal의 함수들 추가
  const calculatePayment = () => {
    const total = localPPEData?.revenue || 0;
    setPayment({
      downPayment: total * (paymentPercent.down / 100),
      middlePayment: total * (paymentPercent.middle / 100),
      finalPayment: total * (paymentPercent.final / 100)
    });
  };

  const calculateStaffCost = (staff: InternalStaff): number => {
    if (!staff.startDate || !staff.endDate) return 0;
    
    const hr = hrMaster.find(h => h.hrId === staff.hrId);
    if (!hr) return 0;

    const start = new Date(staff.startDate);
    const end = new Date(staff.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const workingDays = diffDays - staff.exclusionDays;
    const months = (workingDays / 30.4) * (staff.utilization / 100);
    
    return months * hr.monthlyCost;
  };

  const addInternalStaff = () => {
    setInternalStaff([...internalStaff, {
      hrId: hrMaster[0].hrId,
      name: hrMaster[0].name,
      role: '',
      startDate: '',
      endDate: '',
      utilization: 100,
      exclusionDays: 0,
      totalCost: 0
    }]);
  };

  const updateInternalStaff = (index: number, field: keyof InternalStaff, value: any) => {
    const updated = [...internalStaff];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'hrId') {
      const hr = hrMaster.find(h => h.hrId === value);
      if (hr) {
        updated[index].name = hr.name;
        updated[index].monthlyCost = hr.monthlyCost;
      }
    }
    
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

  if (!isOpen || !project || !localPPEData) return null;

  return (
    <div className="fixed inset-0 z-30">
      <div 
        className="absolute inset-0 bg-black bg-opacity-20"
        onClick={onClose}
      ></div>
      <div className={`absolute top-0 right-0 h-full w-full max-w-5xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg">PPE 상세: {project.name}</h3>
        </header>
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          <div className="space-y-6">
            
            {/* 상단 요약 카드 */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-500">매출액</p>
                <p className="font-bold text-xl mt-1">{formatCurrency(localPPEData.revenue)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-500">투입인건비</p>
                <p className="font-bold text-xl mt-1 text-rose-600">{formatCurrency(localPPEData.laborCost)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-500">외주비용</p>
                <p className="font-bold text-xl mt-1 text-rose-600">{formatCurrency(localPPEData.outsourcingCost)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-500">OPEX</p>
                <p className="font-bold text-xl mt-1 text-rose-600">{formatCurrency(localPPEData.opexCost)}</p>
              </div>
            </section>
            
            {/* 중단 수익성 요약 */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                <p className="font-semibold">Gross Income</p>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(localPPEData.grossIncome)}</p>
                  <p className="text-sm text-slate-500">{localPPEData.grossIncomeRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                <p className="font-semibold">Operation Income</p>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(localPPEData.operationIncome)}</p>
                  <p className="text-sm text-slate-500">{localPPEData.operationIncomeRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-green-200 flex justify-between items-center">
                <p className="font-semibold text-green-700">Profit</p>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-700">{formatCurrency(localPPEData.profit)}</p>
                  <p className="text-sm text-green-600">{localPPEData.profitRate.toFixed(1)}%</p>
                </div>
              </div>
            </section>

            {/* 기본 정보 */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2">
                <label className="block font-medium text-slate-600 mb-1">프로젝트명</label>
                <input 
                  type="text" 
                  value={project.name}
                  className={`w-full p-2 border border-slate-300 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                  readOnly
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">시작일</label>
                <input 
                  type="date" 
                  value={new Date(project.startDate).toISOString().split('T')[0]}
                  className={`w-full p-2 border border-slate-300 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                  readOnly
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">종료일</label>
                <input 
                  type="date" 
                  value={new Date(project.endDate).toISOString().split('T')[0]}
                  className={`w-full p-2 border border-slate-300 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                  readOnly
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">거래처</label>
                <input 
                  type="text" 
                  value={project.client}
                  className={`w-full p-2 border border-slate-300 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                  readOnly
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">담당 PM</label>
                <input 
                  type="text" 
                  value={project.pm}
                  className={`w-full p-2 border border-slate-300 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                  readOnly
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">계약금액</label>
                <input 
                  type="text" 
                  value={formatCurrency(localPPEData.revenue)}
                  onChange={(e) => handleInputChange('revenue', e.target.value)}
                  className={`w-full p-2 border border-slate-300 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                  readOnly={!isEditing}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">상태</label>
                <input 
                  type="text" 
                  value={project.status}
                  className={`w-full p-2 border border-slate-300 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                  readOnly
                />
              </div>
            </section>

            {/* 계약금 관리 */}
            <section className="space-y-2">
              <label className="block font-medium text-slate-600">계약금 관리</label>
              <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-md items-center">
                <span>계약금</span>
                <input type="date" className="w-full p-1 border rounded-md" readOnly={!isEditing} />
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={paymentPercent.down}
                    onChange={(e) => setPaymentPercent({...paymentPercent, down: parseInt(e.target.value) || 0})}
                    className={`w-16 p-1 border rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                    readOnly={!isEditing}
                  />
                  <span className="ml-1">%</span>
                </div>
                <input 
                  type="text" 
                  value={formatCurrency(payment.downPayment)}
                  className="w-full p-1 border rounded-md bg-slate-200"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-md items-center">
                <span>중도금</span>
                <input type="date" className="w-full p-1 border rounded-md" readOnly={!isEditing} />
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={paymentPercent.middle}
                    onChange={(e) => setPaymentPercent({...paymentPercent, middle: parseInt(e.target.value) || 0})}
                    className={`w-16 p-1 border rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                    readOnly={!isEditing}
                  />
                  <span className="ml-1">%</span>
                </div>
                <input 
                  type="text" 
                  value={formatCurrency(payment.middlePayment)}
                  className="w-full p-1 border rounded-md bg-slate-200"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-md items-center">
                <span>잔금</span>
                <input type="date" className="w-full p-1 border rounded-md" readOnly={!isEditing} />
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={paymentPercent.final}
                    onChange={(e) => setPaymentPercent({...paymentPercent, final: parseInt(e.target.value) || 0})}
                    className={`w-16 p-1 border rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                    readOnly={!isEditing}
                  />
                  <span className="ml-1">%</span>
                </div>
                <input 
                  type="text" 
                  value={formatCurrency(payment.finalPayment)}
                  className="w-full p-1 border rounded-md bg-slate-200"
                  readOnly
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
                      {isEditing && <th className="w-12 p-2"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {internalStaff.map((staff, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-1">
                          <select 
                            value={staff.hrId}
                            onChange={(e) => updateInternalStaff(index, 'hrId', parseInt(e.target.value))}
                            className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100 pointer-events-none' : ''}`}
                            disabled={!isEditing}
                          >
                            {hrMaster.map(hr => (
                              <option key={hr.hrId} value={hr.hrId}>{hr.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.role}
                            onChange={(e) => updateInternalStaff(index, 'role', e.target.value)}
                            placeholder="담당업무"
                            className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="date" 
                            value={staff.startDate}
                            onChange={(e) => updateInternalStaff(index, 'startDate', e.target.value)}
                            className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="date" 
                            value={staff.endDate}
                            onChange={(e) => updateInternalStaff(index, 'endDate', e.target.value)}
                            className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="number" 
                            value={staff.utilization}
                            onChange={(e) => updateInternalStaff(index, 'utilization', parseInt(e.target.value) || 0)}
                            className={`w-full border-0 rounded-md text-right ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="number" 
                            value={staff.exclusionDays}
                            onChange={(e) => updateInternalStaff(index, 'exclusionDays', parseInt(e.target.value) || 0)}
                            className={`w-full border-0 rounded-md text-right ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={formatCurrency(staff.totalCost)}
                            className="w-full border-0 rounded-md bg-slate-200 text-right"
                            readOnly
                          />
                        </td>
                        {isEditing && (
                          <td className="p-1 text-center">
                            <button 
                              type="button" 
                              onClick={() => removeInternalStaff(index)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              &times;
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={addInternalStaff}
                    className="w-full text-center p-2 text-indigo-600 hover:bg-indigo-50"
                  >
                    + 인력 추가
                  </button>
                )}
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
                      {isEditing && <th className="w-12 p-2"></th>}
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
                            className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.role}
                            onChange={(e) => updateExternalStaff(index, 'role', e.target.value)}
                            placeholder="담당업무"
                            className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.contact}
                            onChange={(e) => updateExternalStaff(index, 'contact', e.target.value)}
                            placeholder="연락처"
                            className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.period}
                            onChange={(e) => updateExternalStaff(index, 'period', e.target.value)}
                            placeholder="YYYY.MM.DD ~ YYYY.MM.DD"
                            className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="number" 
                            value={staff.cost}
                            onChange={(e) => updateExternalStaff(index, 'cost', parseInt(e.target.value) || 0)}
                            placeholder="금액"
                            className={`w-full border-0 rounded-md text-right ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1">
                          <input 
                            type="text" 
                            value={staff.memo}
                            onChange={(e) => updateExternalStaff(index, 'memo', e.target.value)}
                            placeholder="메모"
                            className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button type="button" className="text-xs text-indigo-600 hover:underline" disabled={!isEditing}>
                            파일첨부
                          </button>
                        </td>
                        {isEditing && (
                          <td className="p-1 text-center">
                            <button 
                              type="button" 
                              onClick={() => removeExternalStaff(index)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              &times;
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={addExternalStaff}
                    className="w-full text-center p-2 text-indigo-600 hover:bg-indigo-50"
                  >
                    + 외부인력 추가
                  </button>
                )}
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
                        {isEditing && <th className="w-12 p-2"></th>}
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
                              className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                              readOnly={!isEditing}
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="number" 
                              value={item.amount}
                              onChange={(e) => updateOpexItem('indirect', index, 'amount', parseInt(e.target.value) || 0)}
                              placeholder="금액"
                              className={`w-full border-0 rounded-md text-right ${!isEditing ? 'bg-slate-100' : ''}`}
                              readOnly={!isEditing}
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={item.note}
                              onChange={(e) => updateOpexItem('indirect', index, 'note', e.target.value)}
                              placeholder="비고"
                              className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                              readOnly={!isEditing}
                            />
                          </td>
                          {isEditing && (
                            <td className="p-1 text-center">
                              <button 
                                type="button" 
                                onClick={() => removeOpexItem('indirect', index)}
                                className="text-slate-400 hover:text-rose-500"
                              >
                                &times;
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {isEditing && (
                    <button 
                      type="button" 
                      onClick={() => addOpexItem('indirect')}
                      className="w-full text-center p-2 text-indigo-600 hover:bg-indigo-50"
                    >
                      + 항목 추가
                    </button>
                  )}
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
                        {isEditing && <th className="w-12 p-2"></th>}
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
                              className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                              readOnly={!isEditing}
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="number" 
                              value={item.amount}
                              onChange={(e) => updateOpexItem('direct', index, 'amount', parseInt(e.target.value) || 0)}
                              placeholder="금액"
                              className={`w-full border-0 rounded-md text-right ${!isEditing ? 'bg-slate-100' : ''}`}
                              readOnly={!isEditing}
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={item.note}
                              onChange={(e) => updateOpexItem('direct', index, 'note', e.target.value)}
                              placeholder="비고"
                              className={`w-full border-0 rounded-md ${!isEditing ? 'bg-slate-100' : ''}`}
                              readOnly={!isEditing}
                            />
                          </td>
                          {isEditing && (
                            <td className="p-1 text-center">
                              <button 
                                type="button" 
                                onClick={() => removeOpexItem('direct', index)}
                                className="text-slate-400 hover:text-rose-500"
                              >
                                &times;
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {isEditing && (
                    <button 
                      type="button" 
                      onClick={() => addOpexItem('direct')}
                      className="w-full text-center p-2 text-indigo-600 hover:bg-indigo-50"
                    >
                      + 항목 추가
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
        <footer className="p-4 bg-slate-50 flex justify-end space-x-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            닫기
          </button>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              수정
            </button>
          ) : (
            <div className="space-x-2">
              <button 
                onClick={() => setIsEditing(false)}
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
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default PPEDetailPanel;