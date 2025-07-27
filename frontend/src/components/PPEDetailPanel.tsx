import React, { useState, useEffect } from 'react';
import { Project, ProjectPPE } from '../types/ppe';

interface PPEDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  ppeData?: ProjectPPE;
  onSave: (updatedData: ProjectPPE) => void;
}

const PPEDetailPanel: React.FC<PPEDetailPanelProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  ppeData,
  onSave 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localPPEData, setLocalPPEData] = useState<ProjectPPE | null>(null);

  useEffect(() => {
    if (ppeData) {
      setLocalPPEData({ ...ppeData });
    } else if (project) {
      // 초기 PPE 데이터 생성
      const initialPPE: ProjectPPE = {
        projectId: project.id,
        revenue: project.contractValue,
        laborCost: 57330000, // 샘플 데이터
        outsourcingCost: 0,
        opexCost: 3000000,
        grossIncome: 0,
        grossIncomeRate: 0,
        operationIncome: 0,
        operationIncomeRate: 0,
        profit: 0,
        profitRate: 0,
        payment: {
          downPayment: project.contractValue * 0.3,
          middlePayment: project.contractValue * 0.4,
          finalPayment: project.contractValue * 0.3,
        },
        client: {
          name: project.client,
          contactPerson: '김철수 부장',
          contactNumber: '010-1234-5678'
        }
      };
      calculateIncome(initialPPE);
      setLocalPPEData(initialPPE);
    }
  }, [project, ppeData]);

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
      if (parent === 'payment') {
        updatedData.payment = {
          ...updatedData.payment,
          [child]: parseInt(value.replace(/,/g, ''), 10) || 0
        };
      } else if (parent === 'client') {
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
      onSave(localPPEData);
      setIsEditing(false);
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  if (!isOpen || !project || !localPPEData) return null;

  return (
    <div className="fixed inset-0 z-30">
      <div 
        className="absolute inset-0 bg-black bg-opacity-20"
        onClick={onClose}
      ></div>
      <div className={`absolute top-0 right-0 h-full w-full max-w-4xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">PPE: {project.name}</h2>
            
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
            
            {/* 중단 요약 카드 */}
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
            
            {/* 하단 상세 정보 */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t">
              <div>
                <h4 className="font-semibold mb-2">프로젝트 정보</h4>
                <div className="space-y-2">
                  <div className="flex">
                    <p className="w-28 text-slate-500">시작일</p>
                    <input 
                      type="text" 
                      value={project.startDate} 
                      className={`flex-1 px-2 py-1 rounded ${!isEditing ? 'bg-transparent' : 'bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
                      readOnly
                    />
                  </div>
                  <div className="flex">
                    <p className="w-28 text-slate-500">종료일</p>
                    <input 
                      type="text" 
                      value={project.endDate} 
                      className={`flex-1 px-2 py-1 rounded ${!isEditing ? 'bg-transparent' : 'bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
                      readOnly
                    />
                  </div>
                  <div className="flex">
                    <p className="w-28 text-slate-500">계약금액</p>
                    <input 
                      type="text" 
                      value={formatCurrency(localPPEData.revenue)} 
                      onChange={(e) => handleInputChange('revenue', e.target.value)}
                      className={`flex-1 px-2 py-1 rounded ${!isEditing ? 'bg-transparent' : 'bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="flex">
                    <p className="w-28 text-slate-500 pl-4">계약금</p>
                    <input 
                      type="text" 
                      value={formatCurrency(localPPEData.payment.downPayment)} 
                      onChange={(e) => handleInputChange('payment.downPayment', e.target.value)}
                      className={`flex-1 px-2 py-1 rounded ${!isEditing ? 'bg-transparent' : 'bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="flex">
                    <p className="w-28 text-slate-500 pl-4">중도금</p>
                    <input 
                      type="text" 
                      value={formatCurrency(localPPEData.payment.middlePayment)} 
                      onChange={(e) => handleInputChange('payment.middlePayment', e.target.value)}
                      className={`flex-1 px-2 py-1 rounded ${!isEditing ? 'bg-transparent' : 'bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="flex">
                    <p className="w-28 text-slate-500 pl-4">잔금</p>
                    <input 
                      type="text" 
                      value={formatCurrency(localPPEData.payment.finalPayment)} 
                      onChange={(e) => handleInputChange('payment.finalPayment', e.target.value)}
                      className={`flex-1 px-2 py-1 rounded ${!isEditing ? 'bg-transparent' : 'bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">거래처 정보</h4>
                <div className="space-y-2">
                  <div className="flex">
                    <p className="w-28 text-slate-500">거래처</p>
                    <input 
                      type="text" 
                      value={localPPEData.client.name} 
                      onChange={(e) => handleInputChange('client.name', e.target.value)}
                      className={`flex-1 px-2 py-1 rounded ${!isEditing ? 'bg-transparent' : 'bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="flex">
                    <p className="w-28 text-slate-500">계약담당자</p>
                    <input 
                      type="text" 
                      value={localPPEData.client.contactPerson} 
                      onChange={(e) => handleInputChange('client.contactPerson', e.target.value)}
                      className={`flex-1 px-2 py-1 rounded ${!isEditing ? 'bg-transparent' : 'bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="flex">
                    <p className="w-28 text-slate-500">연락처</p>
                    <input 
                      type="text" 
                      value={localPPEData.client.contactNumber} 
                      onChange={(e) => handleInputChange('client.contactNumber', e.target.value)}
                      className={`flex-1 px-2 py-1 rounded ${!isEditing ? 'bg-transparent' : 'bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        <footer className="h-16 flex-shrink-0 bg-slate-50 border-t border-slate-200 flex items-center justify-end px-6 space-x-2">
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