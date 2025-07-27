import React, { useState } from 'react';
import { Project, ProjectPPE } from '../types/ppe';
import PPEDetailPanel from '../components/PPEDetailPanel';
import NewProjectModal from '../components/NewProjectModal';

const PPEManagement: React.FC = () => {
  const [projects] = useState<Project[]>([
    { 
      id: 101, 
      name: 'SCL LIS 시스템 ISP', 
      client: 'SCL', 
      startDate: '2025-08-16', 
      endDate: '2026-02-28', 
      pm: '박영훈', 
      contractValue: 90000000, 
      status: '진행중' 
    },
    { 
      id: 102, 
      name: '휴니버스 PMI', 
      client: 'Huniverse', 
      startDate: '2025-07-01', 
      endDate: '2025-12-31', 
      pm: '윤승현', 
      contractValue: 30000000, 
      status: '완료' 
    },
  ]);

  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ppeDataMap, setPpeDataMap] = useState<Map<number, ProjectPPE>>(new Map());

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const getStatusStyle = (status: string) => {
    const styles = {
      '진행중': 'bg-blue-100 text-blue-800',
      '완료': 'bg-green-100 text-green-800',
      '계획': 'bg-slate-200 text-slate-600'
    };
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800';
  };

  const openDetailPanel = (project: Project) => {
    setSelectedProject(project);
    setIsPanelOpen(true);
  };

  const closeDetailPanel = () => {
    setIsPanelOpen(false);
    setSelectedProject(undefined);
  };

  const handleSavePPE = (updatedData: ProjectPPE) => {
    setPpeDataMap(prev => {
      const newMap = new Map(prev);
      newMap.set(updatedData.projectId, updatedData);
      return newMap;
    });
  };

  const handleSaveNewProject = (newProject: Partial<Project>) => {
    // TODO: 새 프로젝트 저장 로직
    console.log('새 프로젝트:', newProject);
    setIsModalOpen(false);
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">PPE</h1>
            <p className="text-slate-500 mt-1">전체 프로젝트의 수익성을 관리합니다.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            + 새 프로젝트
          </button>
        </header>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-left">프로젝트명</th>
                  <th className="px-6 py-3 font-medium text-left">거래처</th>
                  <th className="px-6 py-3 font-medium text-left">시작일</th>
                  <th className="px-6 py-3 font-medium text-left">종료일</th>
                  <th className="px-6 py-3 font-medium text-left">담당 PM</th>
                  <th className="px-6 py-3 font-medium text-right">계약금액</th>
                  <th className="px-6 py-3 font-medium text-center">상태</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
                    onClick={() => openDetailPanel(project)}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">{project.name}</td>
                    <td className="px-6 py-4">{project.client}</td>
                    <td className="px-6 py-4">{project.startDate}</td>
                    <td className="px-6 py-4">{project.endDate}</td>
                    <td className="px-6 py-4">{project.pm}</td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {formatCurrency(project.contractValue)} 원
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <PPEDetailPanel
        isOpen={isPanelOpen}
        onClose={closeDetailPanel}
        project={selectedProject}
        ppeData={selectedProject ? ppeDataMap.get(selectedProject.id) : undefined}
        onSave={handleSavePPE}
      />

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewProject}
      />
    </>
  );
};

export default PPEManagement;