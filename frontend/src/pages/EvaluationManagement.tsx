import React, { useState, useEffect } from 'react';

interface Employee {
  id: number;
  emp_no: string;
  name: string;
  position: string;
  tcr: number;
  ceo_eval: number;
  total_eval: number;
}

interface EvaluationCategory {
  category: string;
  details: string;
}

interface EvaluationModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSubmit: () => void;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({ isOpen, employee, onClose, onSubmit }) => {
  const evaluationCategories: EvaluationCategory[] = [
    {
      category: 'Industry insight',
      details: '헬스케어 산업에 대한 이해수준 및 전문성<br/>- 프로젝트를 수행하기 위해서 준비된 지식 수준'
    },
    {
      category: 'Consulting skill',
      details: '논리설계 및 구조화 역량 (MECE포함)<br/>- 조사방법론 및 조사역량<br/>- 가설 수립, Framework의 수립 및 검증<br/>- 기타 컨설팅 역량'
    },
    {
      category: 'Job attitude',
      details: '책임감과 직급에 적합한 수준의 역할 수행<br/>- 업무 완결성 (Due Date 준수)<br/>- 전문성 확보를 위한 노력 등'
    },
    {
      category: 'Client relationship',
      details: '고객에 대한 이해와 존중<br/>- 고객중심적인 업무 태도 (slide, presentation)<br/>- 불필요한 confilct 지양 등'
    },
    {
      category: 'People management skill',
      details: '팀 조직 내의 화합 / 퍼포먼스의 담보 (PM의 경우)<br/>- 동료와의 협업, 유대관계'
    },
    {
      category: 'Company fit & commitment',
      details: '동료/고객과의 상호존중<br/>- 지속적인 자기 발전과 노력<br/>- 업무에 대한 전문성 확보 노력 등'
    },
    {
      category: 'Overall comment',
      details: '표시 안함 (자동으로 계산됨)'
    }
  ];

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col h-[90vh] relative z-10">
        <header className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg">{employee.name}님 평가</h3>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          <table className="w-full">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left w-1/4">Evaluation Categories</th>
                <th className="px-4 py-2 text-center w-[100px]">Level (1-5)</th>
                <th className="px-4 py-2 text-left w-1/3">Details</th>
                <th className="px-4 py-2 text-left w-1/3">Employee Feedback & Plan for growth</th>
              </tr>
            </thead>
            <tbody>
              {evaluationCategories.map((category, index) => (
                <tr key={index} className="border-b border-slate-200 align-top">
                  <td className="p-4 font-semibold">{category.category}</td>
                  <td className="p-4 text-center">
                    {category.category !== 'Overall comment' ? (
                      <select className="w-full p-2 border border-slate-300 rounded-md">
                        <option>0.0</option>
                        <option>1.0</option>
                        <option>2.0</option>
                        <option>3.0</option>
                        <option>4.0</option>
                        <option>5.0</option>
                      </select>
                    ) : (
                      <p className="font-bold text-lg">0.0</p>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 text-xs leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: category.details }} />
                  </td>
                  <td className="p-4">
                    <textarea 
                      rows={4} 
                      className="w-full p-2 border border-slate-300 rounded-md" 
                      placeholder="피드백 및 성장 계획..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <footer className="p-4 bg-slate-50 flex justify-end space-x-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            취소
          </button>
          <button 
            onClick={onSubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            저장
          </button>
        </footer>
      </div>
    </div>
  );
};

const EvaluationManagement: React.FC = () => {
  const [employees] = useState<Employee[]>([]); // 빈 배열로 시작
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openEvaluationModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const closeEvaluationModal = () => {
    setSelectedEmployee(null);
    setIsModalOpen(false);
  };

  const handleSubmitEvaluation = () => {
    // TODO: API 호출로 평가 데이터 저장
    alert('평가가 저장되었습니다.');
    closeEvaluationModal();
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">평가</h1>
          <p className="text-slate-500 mt-1">담당 직원에 대한 평가를 진행합니다.</p>
        </div>
      </header>
      
      {/* 평가 대상자 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium text-left">사번</th>
                <th className="px-6 py-3 font-medium text-left">이름</th>
                <th className="px-6 py-3 font-medium text-left">직급</th>
                <th className="px-6 py-3 font-medium text-right">TCR</th>
                <th className="px-6 py-3 font-medium text-right">대표님 평가</th>
                <th className="px-6 py-3 font-medium text-right">종합평가</th>
                <th className="px-6 py-3 font-medium text-center">관리</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    평가 대상자가 없습니다.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="border-t border-slate-200">
                    <td className="px-6 py-4">{employee.emp_no}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{employee.name}</td>
                    <td className="px-6 py-4">{employee.position}</td>
                    <td className="px-6 py-4 text-right">{employee.tcr.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">{employee.ceo_eval.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold">{employee.total_eval.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openEvaluationModal(employee)}
                        className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      >
                        평가하기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EvaluationModal
        isOpen={isModalOpen}
        employee={selectedEmployee}
        onClose={closeEvaluationModal}
        onSubmit={handleSubmitEvaluation}
      />
    </div>
  );
};

export default EvaluationManagement;