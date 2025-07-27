import React, { useState } from 'react';
import { MonthlyOpexData } from '../types/opex';
import OpexDetailModal from '../components/OpexDetailModal';

const OpexManagement: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMonthData, setSelectedMonthData] = useState<MonthlyOpexData | undefined>();
  
  const [monthlyOpexData, setMonthlyOpexData] = useState<MonthlyOpexData[]>(
    Array(12).fill(0).map((_, i) => ({
      month: i + 1,
      employeeCount: 12,
      confirmed: i < 6, // 1-6월은 확정, 7-12월은 계획
      indirect: [
        { id: 101 + i * 10, category: 'Office & Mobility & Admin', amount: 10515000, note: '' },
        { id: 102 + i * 10, category: 'HW', amount: 500000, note: '' },
        { id: 103 + i * 10, category: 'SW', amount: 777469, note: '' },
      ],
      direct: [
        { id: 201 + i * 10, category: 'T&E', amount: 10000000, note: '' }
      ]
    }))
  );

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const calculateAnnualTotal = () => {
    return monthlyOpexData.reduce((total, monthData) => {
      const indirectTotal = monthData.indirect.reduce((sum, item) => sum + item.amount, 0);
      const directTotal = monthData.direct.reduce((sum, item) => sum + item.amount, 0);
      return total + indirectTotal + directTotal;
    }, 0);
  };

  const openDetailModal = (month: number) => {
    const monthData = monthlyOpexData.find(data => data.month === month);
    if (monthData) {
      setSelectedMonthData(monthData);
      setIsDetailModalOpen(true);
    }
  };

  const handleUpdateMonthData = (updatedData: MonthlyOpexData) => {
    setMonthlyOpexData(prev => 
      prev.map(data => 
        data.month === updatedData.month ? updatedData : data
      )
    );
  };

  const getStatusStyle = (confirmed: boolean) => {
    return confirmed 
      ? 'px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md'
      : 'px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-md';
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <header className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">OPEX</h1>
            <p className="text-slate-500 mt-1">월별 운영 비용을 관리합니다.</p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="p-2 border border-slate-300 rounded-md text-sm"
            >
              <option value={2025}>2025년</option>
              <option value={2024}>2024년</option>
            </select>
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-right">
              <p className="text-sm text-slate-500">연간 예상 비용</p>
              <p className="text-2xl font-bold mt-1 text-indigo-600">
                {formatCurrency(calculateAnnualTotal())} 원
              </p>
            </div>
          </div>
        </header>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-left">기준월</th>
                  <th className="px-6 py-3 font-medium text-right">Indirect opex</th>
                  <th className="px-6 py-3 font-medium text-right">direct opex</th>
                  <th className="px-6 py-3 font-medium text-right">OPEX 합계</th>
                  <th className="px-6 py-3 font-medium text-center">상태</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {monthlyOpexData.map((data) => {
                  const indirectTotal = data.indirect.reduce((sum, item) => sum + item.amount, 0);
                  const directTotal = data.direct.reduce((sum, item) => sum + item.amount, 0);
                  const total = indirectTotal + directTotal;
                  
                  return (
                    <tr
                      key={data.month}
                      className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
                      onClick={() => openDetailModal(data.month)}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {selectedYear}. {data.month}월
                      </td>
                      <td className="px-6 py-4 text-right">{formatCurrency(indirectTotal)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(directTotal)}</td>
                      <td className="px-6 py-4 text-right font-semibold">{formatCurrency(total)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={getStatusStyle(data.confirmed)}>
                          {data.confirmed ? '확정' : '계획'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <OpexDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        data={selectedMonthData}
        onUpdate={handleUpdateMonthData}
      />
    </>
  );
};

export default OpexManagement;