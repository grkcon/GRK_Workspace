import React, { useState, useEffect } from 'react';
import { employeeApi } from '../services/employeeApi';
import { Employee } from '../types/employee';

interface EvaluationEmployee {
  id: number;
  empNo: string;
  name: string;
  position: string;
  department: string;
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
  employee: EvaluationEmployee | null;
  onClose: () => void;
  onSubmit: (evaluationData: any) => void;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({ isOpen, employee, onClose, onSubmit }) => {
  // 단순히 카테고리별 선택값만 관리하는 상태
  const [values, setValues] = useState<Record<string, string>>({
    'Industry insight': '0.0',
    'Consulting skill': '0.0',
    'Job attitude': '0.0',
    'Client relationship': '0.0',
    'People management skill': '0.0',
    'Company fit & commitment': '0.0'
  });

  // 피드백 데이터를 관리하는 상태
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({
    'Industry insight': '',
    'Consulting skill': '',
    'Job attitude': '',
    'Client relationship': '',
    'People management skill': '',
    'Company fit & commitment': ''
  });

  // 값 변경 핸들러 단순화
  const handleChange = (category: string, value: string) => {
    console.log('변경 전:', values);
    console.log('선택된 카테고리:', category);
    console.log('선택된 값:', value);
    
    // 완전히 새로운 객체를 생성하여 React가 변경을 감지하도록 함
    const newValues = Object.assign({}, values);
    newValues[category] = value;
    setValues(newValues);
    console.log('변경 후:', newValues);
  };

  // evaluationCategories 배열 추가
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
    }
  ];

  // 모달이 열릴 때 기존 평가 데이터 로드하는 useEffect 추가
  useEffect(() => {
    const loadExistingEvaluation = async () => {
      if (isOpen && employee) {
        try {
          // 기존 평가 데이터 가져오기
          const existingEval = await employeeApi.getEvaluation(employee.id);
          
          if (existingEval) {
            // 기존 평가 데이터가 있으면 폼에 설정
            setValues({
              'Industry insight': (existingEval.industryInsight || 0).toFixed(1),
              'Consulting skill': (existingEval.consultingSkill || 0).toFixed(1),
              'Job attitude': (existingEval.jobAttitude || 0).toFixed(1),
              'Client relationship': (existingEval.clientRelationship || 0).toFixed(1),
              'People management skill': (existingEval.peopleManagementSkill || 0).toFixed(1),
              'Company fit & commitment': (existingEval.companyFitCommitment || 0).toFixed(1)
            });
            
            // 기존 피드백 데이터가 있으면 설정
            if (existingEval.feedback) {
              setFeedbacks({
                'Industry insight': existingEval.feedback['Industry insight'] || '',
                'Consulting skill': existingEval.feedback['Consulting skill'] || '',
                'Job attitude': existingEval.feedback['Job attitude'] || '',
                'Client relationship': existingEval.feedback['Client relationship'] || '',
                'People management skill': existingEval.feedback['People management skill'] || '',
                'Company fit & commitment': existingEval.feedback['Company fit & commitment'] || ''
              });
            }
          } else {
            // 기존 평가 데이터가 없으면 초기화
            setValues({
              'Industry insight': '0.0',
              'Consulting skill': '0.0',
              'Job attitude': '0.0',
              'Client relationship': '0.0',
              'People management skill': '0.0',
              'Company fit & commitment': '0.0'
            });
            setFeedbacks({
              'Industry insight': '',
              'Consulting skill': '',
              'Job attitude': '',
              'Client relationship': '',
              'People management skill': '',
              'Company fit & commitment': ''
            });
          }
        } catch (error) {
          // 평가 데이터를 가져올 수 없으면 초기화
          setValues({
            'Industry insight': '0.0',
            'Consulting skill': '0.0',
            'Job attitude': '0.0',
            'Client relationship': '0.0',
            'People management skill': '0.0',
            'Company fit & commitment': '0.0'
          });
          setFeedbacks({
            'Industry insight': '',
            'Consulting skill': '',
            'Job attitude': '',
            'Client relationship': '',
            'People management skill': '',
            'Company fit & commitment': ''
          });
        }
      }
    };

    loadExistingEvaluation();
  }, [isOpen, employee]);

  // 평가 점수 계산 함수 추가 (합계)
  const calculateOverallScore = () => {
    const scores = Object.values(values).map(value => parseFloat(value) || 0);
    const total = scores.reduce((sum, score) => sum + score, 0);
    return total.toFixed(1);
  };

  // 피드백 변경 핸들러 추가
  const handleFeedbackChange = (category: string, value: string) => {
    setFeedbacks(prev => ({
      ...prev,
      [category]: value
    }));
  };

  // employee가 null일 때는 모달을 표시하지 않음
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      <div className={`fixed right-0 top-0 h-full w-[800px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <header className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-lg">{employee?.name}님 평가</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">총 평가점수:</span>
            <span className="font-bold text-xl text-indigo-600">{calculateOverallScore()}</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          <table className="w-full">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left">Evaluation Categories</th>
                <th className="px-4 py-2 text-center" style={{ minWidth: '120px' }}>Level (1-5)</th>
                <th className="px-4 py-2 text-left">Details</th>
                <th className="px-4 py-2 text-left">Employee Feedback & Plan for growth</th>
              </tr>
            </thead>
            <tbody>
              {evaluationCategories.map((category, index) => (
                <tr key={index} className="border-b border-slate-200 align-top">
                  <td className="p-4 font-semibold">{category.category}</td>
                  <td className="p-4 text-center">
                    <select 
                      className="w-full p-2 border border-slate-300 rounded-md text-black bg-white"
                      value={values[category.category]}
                      onChange={(e) => handleChange(category.category, e.target.value)}
                    >
                      <option value="0.0">0.0</option>
                      <option value="1.0">1.0</option>
                      <option value="2.0">2.0</option>
                      <option value="3.0">3.0</option>
                      <option value="4.0">4.0</option>
                      <option value="5.0">5.0</option>
                    </select>
                  </td>
                  <td className="p-4 text-slate-600 text-xs leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: category.details }} />
                  </td>
                  <td className="p-4">
                    <textarea 
                      rows={4} 
                      className="w-full p-2 border border-slate-300 rounded-md" 
                      placeholder="내용을 입력해주세요."
                      value={feedbacks[category.category]}
                      onChange={(e) => handleFeedbackChange(category.category, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 기존 푸터 유지 */}
        <footer className="p-4 bg-slate-50 flex justify-end space-x-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            취소
          </button>
          <button 
            onClick={() => {
              // 평가 데이터 구성
              const evaluationData = {
                industryInsight: parseFloat(values['Industry insight']) || 0,
                consultingSkill: parseFloat(values['Consulting skill']) || 0,
                jobAttitude: parseFloat(values['Job attitude']) || 0,
                clientRelationship: parseFloat(values['Client relationship']) || 0,
                peopleManagementSkill: parseFloat(values['People management skill']) || 0,
                companyFitCommitment: parseFloat(values['Company fit & commitment']) || 0,
                evaluatedBy: 'Admin', // 현재는 하드코딩
                feedback: feedbacks // 피드백 데이터 포함
              };
              onSubmit(evaluationData);
            }}
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
  const [employees, setEmployees] = useState<EvaluationEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EvaluationEmployee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeApi.getActive(); // 활성 직원들만 가져오기
      
      // Employee 타입을 EvaluationEmployee로 변환
      const evaluationEmployees: EvaluationEmployee[] = data.map(emp => ({
        id: emp.id,
        empNo: emp.empNo,
        name: emp.name,
        position: emp.position,
        department: emp.department,
        tcr: 0.0, // TCR은 별도 시스템 값
        total_eval: (emp as any).evaluation?.totalScore || 0.0, // 저장된 평가 총점
        ceo_eval: (emp as any).evaluation?.totalScore || 0.0 // 대표님평가는 총합평가와 동일
      }));
      
      setEmployees(evaluationEmployees);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError('직원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openEvaluationModal = (employee: EvaluationEmployee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const closeEvaluationModal = () => {
    setSelectedEmployee(null);
    setIsModalOpen(false);
  };

  const handleSubmitEvaluation = async (evaluationData: any) => {
    if (!selectedEmployee) return;
    
    try {
      await employeeApi.saveEvaluation(selectedEmployee.id, evaluationData);
      alert('평가가 저장되었습니다.');
      
      // 직원 목록 새로고침 (평가 점수 업데이트 반영)
      await fetchEmployees();
      closeEvaluationModal();
    } catch (error) {
      console.error('평가 저장 실패:', error);
      alert('평가 저장에 실패했습니다.');
    }
  };


  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">평가</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-500">담당 직원에 대한 평가를 진행합니다.</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              총 {employees.length}명
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {/* 평가 대상자 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium text-left">사번</th>
                <th className="px-6 py-3 font-medium text-left">이름</th>
                <th className="px-6 py-3 font-medium text-left">직급</th>
                <th className="px-6 py-3 font-medium text-left">부서</th>
                <th className="px-6 py-3 font-medium text-right">TCR</th>
                <th className="px-6 py-3 font-medium text-right">총합평가</th>
                <th className="px-6 py-3 font-medium text-right">대표님평가</th>
                <th className="px-6 py-3 font-medium text-center">관리</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    직원 목록을 불러오는 중...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    평가 대상자가 없습니다.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4">{employee.empNo}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{employee.name}</td>
                    <td className="px-6 py-4">{employee.position}</td>
                    <td className="px-6 py-4">{employee.department}</td>
                    <td className="px-6 py-4 text-right">{employee.tcr.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold">{employee.total_eval.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right font-bold">{employee.ceo_eval.toFixed(1)}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openEvaluationModal(employee)}
                        className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        {employee.total_eval > 0 ? '평가수정' : '평가하기'}
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