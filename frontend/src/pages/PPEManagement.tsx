import React, { useState, useEffect } from 'react';
import { ProjectPPE as ProjectPPEFromTypes } from '../types/ppe';
import { Project as BackendProject, projectApi, ProjectStatus } from '../services/projectApi';
import { ppeApi } from '../services/ppeApi';
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

  const handleSavePPE = async (updatedData: ProjectPPEFromTypes) => {
    try {
      if (selectedProject) {
        console.log('Attempting to save PPE data for project:', selectedProject.id, updatedData);
        
        // PPE 데이터 준비 (백엔드 API에 맞는 형식으로)
        const ppePayload = {
          revenue: updatedData.revenue || 0,
          laborCost: updatedData.laborCost || 0,
          outsourcingCost: updatedData.outsourcingCost || 0,
          opexCost: updatedData.opexCost || 0,
          grossIncome: updatedData.grossIncome || 0,
          grossIncomeRate: updatedData.grossIncomeRate || 0,
          operationIncome: updatedData.operationIncome || 0,
          operationIncomeRate: updatedData.operationIncomeRate || 0,
          profit: updatedData.profit || 0,
          profitRate: updatedData.profitRate || 0,
          // OPEX 데이터만 포함 (indirectOpex, directOpex)
          indirectOpex: (updatedData.indirectOpex || []).map(item => ({
            category: item.category || '',
            amount: item.amount || 0,
            note: item.note || ''
          })),
          directOpex: (updatedData.directOpex || []).map(item => ({
            category: item.category || '',
            amount: item.amount || 0,
            note: item.note || ''
          }))
        };
        
        console.log('PPE payload:', ppePayload);
        
        let savedPPE;
        
        // 먼저 해당 프로젝트의 PPE 데이터가 있는지 서버에서 확인
        try {
          const existingPPE = await ppeApi.getByProjectId(selectedProject.id);
          console.log('Existing PPE found:', existingPPE);
          
          // 기존 PPE 데이터가 있고 ID가 유효한 경우에만 업데이트
          if (existingPPE && existingPPE.id && existingPPE.id > 0) {
            savedPPE = await ppeApi.update(existingPPE.id, ppePayload);
            console.log('PPE data updated:', savedPPE);
          } else {
            // 기존 PPE 데이터가 없거나 ID가 유효하지 않은 경우 새로 생성
            console.log('Invalid existing PPE ID, creating new one');
            savedPPE = await ppeApi.create(selectedProject.id, ppePayload);
            console.log('New PPE data created:', savedPPE);
          }
          
        } catch (notFoundError) {
          console.log('No existing PPE found, creating new one');
          
          // 새로운 PPE 데이터 생성
          savedPPE = await ppeApi.create(selectedProject.id, ppePayload);
          console.log('New PPE data created:', savedPPE);
        }
        
        // 프로젝트 관련 데이터 저장 (internal staff, external staff, payment)
        // TODO: 별도 API가 필요하다면 여기서 처리
        if (updatedData.internalStaff || updatedData.externalStaff || updatedData.payment) {
          console.log('Additional project data to save:', {
            internalStaff: updatedData.internalStaff,
            externalStaff: updatedData.externalStaff,
            payment: updatedData.payment
          });
          
          // 프로젝트 업데이트 (payment, staff 정보 포함)
          try {
            await projectApi.update(selectedProject.id, {
              projectPayment: updatedData.payment ? {
                downPayment: updatedData.payment.downPayment || 0,
                middlePayment: updatedData.payment.middlePayment || 0,
                finalPayment: updatedData.payment.finalPayment || 0
              } : undefined,
              internalStaff: updatedData.internalStaff ? updatedData.internalStaff.map(staff => ({
                name: staff.name,
                role: staff.role,
                startDate: staff.startDate,
                endDate: staff.endDate,
                utilization: staff.utilization,
                exclusionDays: staff.exclusionDays,
                totalCost: staff.totalCost,
                monthlyCost: staff.monthlyCost
              })) : undefined,
              externalStaff: updatedData.externalStaff ? updatedData.externalStaff.map(staff => ({
                name: staff.name,
                role: staff.role,
                contact: staff.contact,
                period: staff.period,
                cost: staff.cost,
                memo: staff.memo
              })) : undefined
            });
            console.log('Project data updated with staff and payment info');
          } catch (projectUpdateError) {
            console.warn('Failed to update project data:', projectUpdateError);
            // PPE는 저장되었으므로 경고만 표시
          }
        }
        
        // 로컬 상태 업데이트
        setPpeDataMap(prev => {
          const newMap = new Map(prev);
          newMap.set(selectedProject.id, updatedData);
          return newMap;
        });
        
        // 프로젝트 목록 새로고침
        await fetchProjects();
        
        alert('저장되었습니다.');
      }
    } catch (error) {
      console.error('Failed to save PPE data:', error);
      alert('저장에 실패했습니다: ' + (error as Error).message);
    }
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