import React, { useState, useEffect } from 'react';
import { crApi, Employee, CRDetail } from '../services/crApi';

interface CRDetailPanelProps {
  isOpen: boolean;
  employee: Employee | null;
  crDetails: CRDetail[];
  onClose: () => void;
}

const CRDetailPanel: React.FC<CRDetailPanelProps> = ({ isOpen, employee, crDetails, onClose }) => {
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const totalCR = crDetails.reduce((sum, detail) => sum + detail.cr, 0);

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-30">
      <div className="absolute inset-0 bg-black bg-opacity-20" onClick={onClose}></div>
      <div 
        className={`absolute top-0 right-0 h-full w-full max-w-3xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="h-16 flex-shrink-0 border-b border-slate-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-bold">{employee.name}님 CR 상세 내역</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 text-2xl"
          >
            ×
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-left">참여 프로젝트명</th>
                    <th className="px-6 py-3 font-medium text-right">프로젝트 매출액</th>
                    <th className="px-6 py-3 font-medium text-right">투입원가 비중</th>
                    <th className="px-6 py-3 font-medium text-right">기여 매출 (CR)</th>
                  </tr>
                </thead>
                <tbody>
                  {crDetails.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        참여한 프로젝트가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    crDetails.map((detail, index) => (
                      <tr key={index} className="border-t border-slate-200">
                        <td className="px-6 py-4 font-semibold">{detail.projectName}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(detail.projectRevenue)} 원</td>
                        <td className="px-6 py-4 text-right">{(detail.costWeight * 100).toFixed(1)}%</td>
                        <td className="px-6 py-4 text-right font-semibold text-indigo-600">
                          {formatCurrency(detail.cr)} 원
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {crDetails.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold">
                    <tr>
                      <td className="px-6 py-3 text-left" colSpan={3}>
                        Total Covered Revenue (누적 CR)
                      </td>
                      <td className="px-6 py-3 text-right text-indigo-600">
                        {formatCurrency(totalCR)} 원
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CRManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [crDetails, setCrDetails] = useState<CRDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployeeCRList();
  }, []);

  const loadEmployeeCRList = async () => {
    try {
      setLoading(true);
      const data = await crApi.getEmployeeCRList();
      setEmployees(data);
    } catch (error) {
      console.error('CR 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const openPanel = async (employee: Employee) => {
    try {
      setSelectedEmployee(employee);
      setIsPanelOpen(true);
      // 직원별 CR 상세 내역 로드
      const details = await crApi.getEmployeeCRDetails(employee.id);
      setCrDetails(details);
    } catch (error) {
      console.error('CR 상세 데이터 로딩 실패:', error);
    }
  };

  const closePanel = () => {
    setSelectedEmployee(null);
    setIsPanelOpen(false);
    setCrDetails([]);
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">CR (Contribution Rate)</h1>
          <p className="text-slate-500 mt-1">직원별 프로젝트 기여도를 확인합니다.</p>
        </div>
      </header>
      
      {/* 직원별 CR 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium text-left">사번</th>
                <th className="px-6 py-3 font-medium text-left">이름</th>
                <th className="px-6 py-3 font-medium text-left">직무</th>
                <th className="px-6 py-3 font-medium text-left">직급</th>
                <th className="px-6 py-3 font-medium text-right">누적 CR (기여 매출)</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    CR 데이터를 불러오는 중...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    CR 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr 
                    key={employee.id} 
                    className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
                    onClick={() => openPanel(employee)}
                  >
                    <td className="px-6 py-4">{employee.emp_no}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{employee.name}</td>
                    <td className="px-6 py-4">{employee.department}</td>
                    <td className="px-6 py-4">{employee.position}</td>
                    <td className="px-6 py-4 text-right font-bold">
                      {formatCurrency(employee.totalCR)} 원
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CRDetailPanel
        isOpen={isPanelOpen}
        employee={selectedEmployee}
        crDetails={crDetails}
        onClose={closePanel}
      />
    </div>
  );
};

export default CRManagement;