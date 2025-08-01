import React, { useState, useEffect } from 'react';
import { employeeApi } from '../services/employeeApi';
import { cashflowApi } from '../services/cashflowApi';
import { opexApi } from '../services/opexApi';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    employeeCount: 0,
    activeEmployeeCount: 0,
    monthlyOpexTotal: 0,
    currentMonthCashFlow: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 직원 데이터 가져오기
      const [allEmployees, activeEmployees] = await Promise.all([
        employeeApi.getAll(),
        employeeApi.getActive(),
      ]);

      // OPEX 요약 데이터 가져오기
      const opexSummary = await opexApi.getSummary();
      const monthlyOpexTotal = opexSummary.reduce((sum, item) => sum + item.totalAmount, 0);

      // 현재 월 현금흐름 가져오기 (예시로 2025년 1월)
      let currentMonthCashFlow = 0;
      try {
        const cashFlowData = await cashflowApi.getMonthlySummary(2025, 1);
        currentMonthCashFlow = cashFlowData.totalEndingCash;
      } catch (err) {
        console.log('No cash flow data available');
      }

      setStats({
        employeeCount: allEmployees.length,
        activeEmployeeCount: activeEmployees.length,
        monthlyOpexTotal,
        currentMonthCashFlow,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">GRK Workspace</h1>
          <p className="text-slate-500 mt-1">업무의 중심, 모든 데이터를 한 곳에서 관리하세요.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 통계 카드들 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-slate-800">
                  {loading ? '...' : stats.employeeCount}
                </h3>
                <p className="text-sm text-slate-500">전체 직원</p>
                <p className="text-xs text-green-600">
                  재직 {loading ? '...' : stats.activeEmployeeCount}명
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-slate-800">
                  {loading ? '...' : `₩${(stats.monthlyOpexTotal / 10000).toFixed(0)}만`}
                </h3>
                <p className="text-sm text-slate-500">월간 OPEX</p>
                <p className="text-xs text-slate-600">운영비 총합</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-slate-800">
                  {loading ? '...' : `₩${(stats.currentMonthCashFlow / 10000).toFixed(0)}만`}
                </h3>
                <p className="text-sm text-slate-500">현금 흐름</p>
                <p className="text-xs text-slate-600">이번 달 기말</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-slate-800">9:00</h3>
                <p className="text-sm text-slate-500">평균 출근</p>
                <p className="text-xs text-slate-600">이번 주 기준</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 인사 관리 카드 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-slate-800">인사 관리</h3>
                <p className="text-sm text-slate-500">직원 정보 관리</p>
              </div>
            </div>
          </div>

          {/* 일정 관리 카드 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-slate-800">일정 관리</h3>
                <p className="text-sm text-slate-500">업무 일정 추적</p>
              </div>
            </div>
          </div>

          {/* OPEX 관리 카드 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-slate-800">OPEX 관리</h3>
                <p className="text-sm text-slate-500">운영비 추적</p>
              </div>
            </div>
          </div>

          {/* 출퇴근 관리 카드 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-slate-800">출퇴근 관리</h3>
                <p className="text-sm text-slate-500">근태 현황 조회</p>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
};

export default Dashboard;