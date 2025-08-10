import React, { useState, useEffect } from 'react';
import { Project, ProjectPPE as ProjectPPEFromTypes } from '../types/ppe';
import { Project as BackendProject, projectApi, ProjectStatus } from '../services/projectApi';
import PPEDetailPanel from '../components/PPEDetailPanel';
import NewProjectModal from '../components/NewProjectModal';

const PPEManagement: React.FC = () => {
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const [selectedProject, setSelectedProject] = useState<BackendProject | undefined>();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ppeDataMap, setPpeDataMap] = useState<Map<number, ProjectPPEFromTypes>>(new Map());

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const getStatusStyle = (status: ProjectStatus) => {
    const styles = {
      [ProjectStatus.ONGOING]: 'bg-blue-100 text-blue-800',
      [ProjectStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [ProjectStatus.PLANNED]: 'bg-slate-200 text-slate-600'
    };
    return styles[status] || 'bg-slate-100 text-slate-800';
  };

  const openDetailPanel = (project: BackendProject) => {
    setSelectedProject(project);
    setIsPanelOpen(true);
  };

  const closeDetailPanel = () => {
    setIsPanelOpen(false);
    setSelectedProject(undefined);
  };

  const handleSavePPE = (updatedData: ProjectPPEFromTypes) => {
    setPpeDataMap(prev => {
      const newMap = new Map(prev);
      // updatedData.project?.id를 사용하거나, project가 없으면 id를 직접 사용
      const projectId = updatedData.project?.id || updatedData.id;
      if (projectId) {
        newMap.set(projectId, updatedData);
      }
      return newMap;
    });
  };

  const handleSaveNewProject = async (newProject: any) => {
    try {
      await projectApi.create(newProject);
      await fetchProjects(); // 프로젝트 목록 새로고침
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      프로젝트가 없습니다.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
                      onClick={() => openDetailPanel(project)}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">{project.name}</td>
                      <td className="px-6 py-4">{project.client}</td>
                      <td className="px-6 py-4">{new Date(project.startDate).toLocaleDateString('ko-KR')}</td>
                      <td className="px-6 py-4">{new Date(project.endDate).toLocaleDateString('ko-KR')}</td>
                      <td className="px-6 py-4">{project.pm}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatCurrency(typeof project.contractValue === 'string' ? parseFloat(project.contractValue) : project.contractValue)} 원
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
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