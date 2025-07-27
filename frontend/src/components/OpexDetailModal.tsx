import React, { useState, useEffect } from 'react';
import { MonthlyOpexData, OpexItem } from '../types/opex';

interface OpexDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: MonthlyOpexData;
  onUpdate: (updatedData: MonthlyOpexData) => void;
}

const OpexDetailModal: React.FC<OpexDetailModalProps> = ({ isOpen, onClose, data, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [localData, setLocalData] = useState<MonthlyOpexData | null>(null);

  useEffect(() => {
    if (data) {
      setLocalData(JSON.parse(JSON.stringify(data))); // Deep copy
      setEditMode(!data.confirmed);
    }
  }, [data]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const unformatCurrency = (str: string) => {
    return parseInt(String(str).replace(/,/g, ''), 10) || 0;
  };

  const updateItem = (id: number, field: keyof OpexItem, value: string | number, isDirect: boolean) => {
    if (!localData) return;
    
    const targetArray = isDirect ? localData.direct : localData.indirect;
    const itemIndex = targetArray.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
      const updatedArray = [...targetArray];
      if (field === 'amount') {
        updatedArray[itemIndex] = { ...updatedArray[itemIndex], [field]: typeof value === 'string' ? unformatCurrency(value) : value };
      } else {
        updatedArray[itemIndex] = { ...updatedArray[itemIndex], [field]: value };
      }
      
      setLocalData({
        ...localData,
        [isDirect ? 'direct' : 'indirect']: updatedArray
      });
    }
  };

  const addRow = (type: 'indirect' | 'direct') => {
    if (!localData) return;
    
    const newId = Date.now();
    const newItem: OpexItem = {
      id: newId,
      category: '새 항목',
      amount: 0,
      note: ''
    };
    
    setLocalData({
      ...localData,
      [type]: [...localData[type], newItem]
    });
  };

  const deleteRow = (id: number, isDirect: boolean) => {
    if (!localData) return;
    
    const targetArray = isDirect ? localData.direct : localData.indirect;
    const filteredArray = targetArray.filter(item => item.id !== id);
    
    setLocalData({
      ...localData,
      [isDirect ? 'direct' : 'indirect']: filteredArray
    });
  };

  const handleConfirm = () => {
    if (!localData) return;
    
    const confirmedData = {
      ...localData,
      confirmed: true
    };
    
    setLocalData(confirmedData);
    setEditMode(false);
    onUpdate(confirmedData);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  if (!isOpen || !localData) return null;

  const indirectTotal = localData.indirect.reduce((sum, item) => sum + item.amount, 0);
  const directTotal = localData.direct.reduce((sum, item) => sum + item.amount, 0);
  const total = indirectTotal + directTotal;

  const renderItemRow = (item: OpexItem, isDirect: boolean) => {
    const percentage = total > 0 ? (item.amount / total * 100).toFixed(1) + '%' : '0.0%';
    
    return (
      <tr key={item.id} className="border-b border-slate-200">
        <td className="px-4 py-2 flex items-center">
          <input
            type="text"
            value={item.category}
            onChange={(e) => updateItem(item.id, 'category', e.target.value, isDirect)}
            className={`w-full text-left pl-8 px-2 py-1 rounded ${!editMode ? 'bg-transparent cursor-default' : 'bg-white border-2 border-indigo-500 outline-none'}`}
            readOnly={!editMode}
          />
          {editMode && (
            <button
              onClick={() => deleteRow(item.id, isDirect)}
              className="text-slate-400 hover:text-rose-500 ml-2"
            >
              &times;
            </button>
          )}
        </td>
        <td className="px-4 py-2 text-right">
          <input
            type="text"
            value={formatCurrency(item.amount)}
            onChange={(e) => updateItem(item.id, 'amount', e.target.value, isDirect)}
            className={`w-full text-right px-2 py-1 rounded ${!editMode ? 'bg-transparent cursor-default' : 'bg-white border-2 border-indigo-500 outline-none'}`}
            readOnly={!editMode}
          />
        </td>
        <td className="px-4 py-2 text-right">{percentage}</td>
        <td className="px-4 py-2 text-xs text-slate-500">
          <input
            type="text"
            value={item.note}
            onChange={(e) => updateItem(item.id, 'note', e.target.value, isDirect)}
            className={`w-full text-left px-2 py-1 rounded ${!editMode ? 'bg-transparent cursor-default' : 'bg-white border-2 border-indigo-500 outline-none'}`}
            readOnly={!editMode}
          />
        </td>
      </tr>
    );
  };

  const renderHeaderRow = (title: string, type: 'indirect' | 'direct') => (
    <tr className="bg-slate-100 font-bold">
      <td className="px-4 py-2 flex items-center">
        {title}
        {editMode && (
          <button
            onClick={() => addRow(type)}
            className="ml-2 text-indigo-600 hover:text-indigo-800 text-lg font-bold"
          >
            +
          </button>
        )}
      </td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      ></div>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl relative z-50 flex flex-col h-[90vh]">
        <header className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-lg">2025년 {localData.month}월 OPEX 상세</h3>
          </div>
          <div className="flex-1 flex justify-center space-x-6 text-center">
            <div>
              <p className="text-xs text-slate-500">기준 직원수</p>
              <p className="font-semibold">{localData.employeeCount} 명</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Indirect opex</p>
              <p className="font-semibold">{formatCurrency(indirectTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">direct opex</p>
              <p className="font-semibold">{formatCurrency(directTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">OPEX 합계</p>
              <p className="font-bold text-indigo-600">{formatCurrency(total)}</p>
            </div>
          </div>
          <div className="space-x-2">
            {localData.confirmed && !editMode ? (
              <button
                onClick={handleEdit}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
              >
                수정
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                확정
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
            >
              닫기
            </button>
          </div>
        </header>
        <div className="p-6 flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left w-2/5">항목</th>
                <th className="px-4 py-2 text-right w-1/5">비용 (원)</th>
                <th className="px-4 py-2 text-right w-1/5">비중</th>
                <th className="px-4 py-2 text-left w-1/5">비고</th>
              </tr>
            </thead>
            <tbody>
              {renderHeaderRow('Indirect Opex', 'indirect')}
              {localData.indirect.map(item => renderItemRow(item, false))}
              {renderHeaderRow('Direct Opex', 'direct')}
              {localData.direct.map(item => renderItemRow(item, true))}
              <tr className="bg-slate-200 font-bold text-base">
                <td className="px-4 py-3">Monthly Total Expense</td>
                <td className="px-4 py-3 text-right">{formatCurrency(total)}</td>
                <td className="px-4 py-3 text-right">100%</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OpexDetailModal;