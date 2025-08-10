import React, { useState, useEffect } from 'react';

interface PersonalEvaluation {
  id: number;
  period: string;
  evaluator: string;
  tcr: number;
  ceo_eval: number;
  total_eval: number;
  feedback: string;
  status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS';
}

interface EvaluationDetail {
  category: string;
  score: number;
  feedback: string;
  details: string;
}

interface EvaluationDetailModalProps {
  isOpen: boolean;
  evaluation: PersonalEvaluation | null;
  onClose: () => void;
}

const EvaluationDetailModal: React.FC<EvaluationDetailModalProps> = ({ isOpen, evaluation, onClose }) => {
  const evaluationCategories: EvaluationDetail[] = [
    {
      category: 'Industry insight',
      score: 3.5,
      feedback: '헬스케어 산업에 대한 이해도가 향상되었습니다.',
      details: '헬스케어 산업에 대한 이해수준 및 전문성\n- 프로젝트를 수행하기 위해서 준비된 지식 수준'
    },
    {
      category: 'Consulting skill',
      score: 4.0,
      feedback: '논리적 사고와 구조화 능력이 뛰어납니다.',
      details: '논리설계 및 구조화 역량 (MECE포함)\n- 조사방법론 및 조사역량\n- 가설 수립, Framework의 수립 및 검증\n- 기타 컨설팅 역량'
    },
    {
      category: 'Job attitude',
      score: 4.5,
      feedback: '책임감 있는 업무 수행을 보여주고 있습니다.',
      details: '책임감과 직급에 적합한 수준의 역할 수행\n- 업무 완결성 (Due Date 준수)\n- 전문성 확보를 위한 노력 등'
    },
    {
      category: 'Client relationship',
      score: 3.8,
      feedback: '고객 대응에서 전문성을 보였습니다.',
      details: '고객에 대한 이해와 존중\n- 고객중심적인 업무 태도 (slide, presentation)\n- 불필요한 confilct 지양 등'
    },
    {
      category: 'People management skill',
      score: 3.2,
      feedback: '팀워크 개선이 필요합니다.',
      details: '팀 조직 내의 화합 / 퍼포먼스의 담보 (PM의 경우)\n- 동료와의 협업, 유대관계'
    },
    {
      category: 'Company fit & commitment',
      score: 4.2,
      feedback: '회사에 대한 높은 몰입도를 보입니다.',
      details: '동료/고객과의 상호존중\n- 지속적인 자기 발전과 노력\n- 업무에 대한 전문성 확보 노력 등'
    }
  ];

  if (!isOpen || !evaluation) return null;

  const averageScore = evaluationCategories.reduce((sum, cat) => sum + cat.score, 0) / evaluationCategories.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col h-[90vh] relative z-10">
        <header className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg">{evaluation.period} 평가 상세</h3>
          <p className="text-sm text-slate-600 mt-1">평가자: {evaluation.evaluator}</p>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          {/* 종합 점수 */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-lg text-slate-800">종합 평가</h4>
                <p className="text-sm text-slate-600">TCR: {evaluation.tcr.toFixed(2)} | CEO 평가: {evaluation.ceo_eval.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600">{evaluation.total_eval.toFixed(1)}</div>
                <div className="text-sm text-slate-500">평균: {averageScore.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* 상세 평가 */}
          <div className="bg-white rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">평가 항목</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700 w-24">점수</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">피드백</th>
                </tr>
              </thead>
              <tbody>
                {evaluationCategories.map((category, index) => (
                  <tr key={index} className="border-t border-slate-200">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-800">{category.category}</div>
                      <div className="text-xs text-slate-500 mt-1 whitespace-pre-line">{category.details}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                        category.score >= 4.0 ? 'bg-green-100 text-green-800' :
                        category.score >= 3.0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {category.score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{category.feedback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 전체 피드백 */}
          {evaluation.feedback && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h5 className="font-semibold text-slate-800 mb-2">종합 피드백</h5>
              <p className="text-slate-600 whitespace-pre-wrap">{evaluation.feedback}</p>
            </div>
          )}
        </div>
        
        <footer className="p-4 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            닫기
          </button>
        </footer>
      </div>
    </div>
  );
};

const EvaluationPersonal: React.FC = () => {
  const [evaluations] = useState<PersonalEvaluation[]>([]); // 빈 배열로 시작
  const [selectedEvaluation, setSelectedEvaluation] = useState<PersonalEvaluation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openEvaluationDetail = (evaluation: PersonalEvaluation) => {
    setSelectedEvaluation(evaluation);
    setIsModalOpen(true);
  };

  const closeEvaluationDetail = () => {
    setSelectedEvaluation(null);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">완료</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">진행중</span>;
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">대기</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">내 평가</h1>
          <p className="text-slate-500 mt-1">나의 평가 이력을 확인할 수 있습니다.</p>
        </div>
      </header>
      
      {/* 평가 이력 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium text-left">평가 기간</th>
                <th className="px-6 py-3 font-medium text-left">평가자</th>
                <th className="px-6 py-3 font-medium text-right">TCR</th>
                <th className="px-6 py-3 font-medium text-right">CEO 평가</th>
                <th className="px-6 py-3 font-medium text-right">종합평가</th>
                <th className="px-6 py-3 font-medium text-center">상태</th>
                <th className="px-6 py-3 font-medium text-center">관리</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-medium">평가 이력이 없습니다.</p>
                      <p className="text-sm text-slate-400 mt-1">평가가 완료되면 여기에 표시됩니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                evaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold">{evaluation.period}</td>
                    <td className="px-6 py-4">{evaluation.evaluator}</td>
                    <td className="px-6 py-4 text-right">{evaluation.tcr.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">{evaluation.ceo_eval.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600">{evaluation.total_eval.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(evaluation.status)}</td>
                    <td className="px-6 py-4 text-center">
                      {evaluation.status === 'COMPLETED' && (
                        <button 
                          onClick={() => openEvaluationDetail(evaluation)}
                          className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                        >
                          상세보기
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EvaluationDetailModal
        isOpen={isModalOpen}
        evaluation={selectedEvaluation}
        onClose={closeEvaluationDetail}
      />
    </div>
  );
};

export default EvaluationPersonal;