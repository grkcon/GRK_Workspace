import React, { useState, useEffect } from 'react';
import { MonthlyOpexData, OpexItem, OpexType, OpexRelationshipType } from '../types/opex';
import { exchangeRateApi, ExchangeRateResponse } from '../services/exchangeRateApi';
import { opexApi } from '../services/opexApi';
import { convertMonthlyOpexToData } from '../utils/opexUtils';

interface OpexDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: MonthlyOpexData;
  year: number;
  onUpdate: (updatedData: MonthlyOpexData) => Promise<MonthlyOpexData>;
  onConfirmSuccess?: () => void;
}

const OpexDetailModal: React.FC<OpexDetailModalProps> = ({ isOpen, onClose, data, year, onUpdate, onConfirmSuccess }) => {
  const [editMode, setEditMode] = useState(false);
  const [localData, setLocalData] = useState<MonthlyOpexData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateResponse | null>(null);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);

  useEffect(() => {
    if (data) {
      setLocalData(JSON.parse(JSON.stringify(data))); // Deep copy
      setEditMode(!data.confirmed);
    }
  }, [data]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      fetchExchangeRate();
    }
  }, [isOpen]);

  const fetchExchangeRate = async () => {
    if (loadingExchangeRate) return;
    
    try {
      setLoadingExchangeRate(true);
      const rateData = await exchangeRateApi.getCurrentRate();
      setExchangeRate(rateData);
    } catch (error) {
      console.error('환율 정보를 가져오는데 실패했습니다:', error);
      // 실패 시 기본값 설정 (예: 1,300원)
      setExchangeRate({
        usdToKrw: {
          currency: 'USD',
          rate: 1300,
          date: new Date().toISOString().split('T')[0],
          change: 0
        },
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoadingExchangeRate(false);
    }
  };


  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };


  const extractNumericValue = (value: string): number => {
    // 숫자만 추출하고 정수로 변환
    const numericValue = value.replace(/[^\d]/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  };

  const updateItem = (id: number, field: keyof OpexItem, value: string | number, isDirect: boolean) => {
    if (!localData) return;
    
    const targetArray = isDirect ? directItems : indirectItems;
    const itemIndex = targetArray.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
      const updatedArray = [...targetArray];
      
      if (field === 'amount') {
        // amount 필드는 항상 숫자로 저장
        const numericAmount = typeof value === 'string' ? extractNumericValue(value) : value;
        updatedArray[itemIndex] = { ...updatedArray[itemIndex], [field]: numericAmount };
      } else {
        // 다른 필드는 그대로 저장
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
    
    // 임시 ID 생성 (음수로 설정하여 새 항목임을 명확히 구분)
    const existingIds = [
      ...indirectItems.map(item => item.id),
      ...directItems.map(item => item.id)
    ];
    
    // 기존 임시 ID들 중 가장 작은 음수 찾기
    const existingTempIds = existingIds.filter(id => id < 0);
    const nextTempId = existingTempIds.length > 0 ? Math.min(...existingTempIds) - 1 : -1;
    
    console.log('[DEBUG] 새 항목 추가:', {
      type,
      tempId: nextTempId,
      existingIds: existingIds.slice(0, 5), // 처음 5개만 로그
      existingTempIds
    });
    
    const newItem: OpexItem = {
      id: nextTempId, // 음수 임시 ID 사용
      category: '새 항목',
      amount: 0,
      note: '',
      type: type === 'indirect' ? OpexType.INDIRECT : OpexType.DIRECT,
      relationshipType: OpexRelationshipType.MONTHLY_OPEX,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setLocalData({
      ...localData,
      [type]: [...(localData[type] || []), newItem]
    });
    
    console.log('[DEBUG] 새 항목 추가 완료:', {
      newItemId: newItem.id,
      newItemCategory: newItem.category
    });
  };

  const deleteRow = async (id: number, isDirect: boolean) => {
    if (!localData) return;
    
    const targetArray = isDirect ? directItems : indirectItems;
    const itemToDelete = targetArray.find(item => item.id === id);
    
    if (!itemToDelete) return;
    
    // 삭제 확인
    const confirmMessage = `"${itemToDelete.category}" 항목을 삭제하시겠습니까?`;
    if (!window.confirm(confirmMessage)) return;
    
    // 새로 추가된 항목(음수 ID)인 경우 로컬에서만 삭제
    if (id < 0) {
      const filteredArray = targetArray.filter(item => item.id !== id);
      setLocalData({
        ...localData,
        [isDirect ? 'direct' : 'indirect']: filteredArray
      });
      return;
    }
    
    // 기존 DB 항목인 경우 즉시 DB에서 삭제
    try {
      await opexApi.deleteOpexItem(id);
      
      // 삭제 성공 시 로컬 상태에서도 제거
      const filteredArray = targetArray.filter(item => item.id !== id);
      setLocalData({
        ...localData,
        [isDirect ? 'direct' : 'indirect']: filteredArray
      });
      
      console.log(`[DEBUG] 항목 삭제 완료: ID ${id} - ${itemToDelete.category}`);
    } catch (error) {
      console.error('항목 삭제 실패:', error);
      alert('항목 삭제에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const handleConfirm = async () => {
    if (!localData) return;
    
    // 편집 모드인 경우 먼저 저장해야 함
    if (editMode) {
      alert('데이터를 먼저 저장한 후 확정해 주세요.');
      return;
    }
    
    // OPEX 항목이 하나라도 있는지 확인
    const hasOpexItems = indirectItems.length > 0 || directItems.length > 0;
    
    if (!hasOpexItems) {
      alert('OPEX 항목이 없습니다. 먼저 OPEX 항목을 추가하고 저장한 후 확정해 주세요.');
      return;
    }
    
    // 사용자 확인
    const userConfirmed = window.confirm(
      `${localData.month}월을 확정하시겠습니까?\n\n확정 시 ${localData.month}월 이후 미확정 달에 현재 데이터가 자동으로 반영됩니다.`
    );
    
    if (!userConfirmed) return;
    
    try {
      // 백엔드 확정 API 호출
      const confirmResponse = await opexApi.confirmMonth(year, localData.month);
      console.log('확정 API 응답:', confirmResponse);
      
      // 확정된 월 데이터 업데이트
      let confirmedData = localData;
      if (confirmResponse.confirmedMonth) {
        // 백엔드에서 확정된 월 데이터를 반환한 경우
        confirmedData = convertMonthlyOpexToData(confirmResponse.confirmedMonth);
      } else {
        // 기존 데이터를 확정 상태로 변경
        confirmedData = {
          ...localData,
          confirmed: true
        };
      }
      
      setLocalData(confirmedData);
      setEditMode(false);
      
      // 성공 알림
      alert(`${localData.month}월이 성공적으로 확정되었습니다.\n이후 미확정 달에 데이터가 반영되었습니다.`);
      
      // 모달 닫기
      onClose();
      
      // 전체 데이터 새로고침 (확정으로 인해 다른 월 데이터도 변경될 수 있음)
      if (onConfirmSuccess) {
        onConfirmSuccess();
      }
      
    } catch (error) {
      console.error('확정 처리 실패:', error);
      alert('확정 처리에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    if (localData) {
      try {
        console.log('[DEBUG] 저장 전 localData:', {
          month: localData.month,
          indirectCount: localData.indirect?.length || 0,
          directCount: localData.direct?.length || 0,
          indirectIds: localData.indirect?.map(item => ({ id: item.id, category: item.category })) || [],
          directIds: localData.direct?.map(item => ({ id: item.id, category: item.category })) || []
        });
        
        const savedData = await onUpdate(localData);
        
        console.log('[DEBUG] 저장 후 savedData:', {
          month: savedData.month,
          indirectCount: savedData.indirect?.length || 0,
          directCount: savedData.direct?.length || 0,
          indirectIds: savedData.indirect?.map(item => ({ id: item.id, category: item.category })) || [],
          directIds: savedData.direct?.map(item => ({ id: item.id, category: item.category })) || []
        });
        
        setLocalData(savedData);
        setEditMode(false);
        
        console.log('[DEBUG] 저장 완료 - ID 매핑 확인됨');
      } catch (error) {
        console.error('저장 실패:', error);
        const errorMessage = error instanceof Error ? error.message : '저장에 실패했습니다.';
        alert(errorMessage);
      }
    }
  };

  if (!isOpen || !localData) return null;

  // Defensive checks for data structure
  const indirectItems = localData.indirect || [];
  const directItems = localData.direct || [];
  
  const indirectTotal = indirectItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const directTotal = directItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const total = indirectTotal + directTotal;

  const renderItemRow = (item: OpexItem, isDirect: boolean, index: number) => {
    const percentage = total > 0 ? (item.amount / total * 100).toFixed(1) + '%' : '0.0%';
    const usdAmount = exchangeRate ? (item.amount / exchangeRate.usdToKrw.rate) : 0;
    
    const formatUSD = (amount: number) => {
      return '$' + new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(amount));
    };
    
    return (
      <tr key={item.id} className="border-b border-slate-200">
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-medium text-slate-600">
            {index + 1}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center">
            <input
              type="text"
              value={item.category}
              onChange={(e) => updateItem(item.id, 'category', e.target.value, isDirect)}
              className={`flex-1 text-left px-3 py-2 rounded text-sm ${!editMode ? 'bg-transparent cursor-default border-transparent' : 'bg-white border border-slate-300 focus:border-indigo-500 outline-none'}`}
              readOnly={!editMode}
              placeholder={editMode ? "항목명을 입력하세요" : ""}
            />
            {editMode && (
              <button
                onClick={() => deleteRow(item.id, isDirect)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 ml-2 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors duration-150"
                title={`"${item.category}" 항목 삭제`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={formatCurrency(item.amount)}
            onChange={(e) => {
              if (editMode) {
                // 사용자 입력에서 숫자만 추출하여 저장
                updateItem(item.id, 'amount', e.target.value, isDirect);
              }
            }}
            className={`w-full text-right px-3 py-2 rounded text-sm min-w-0 ${!editMode ? 'bg-transparent cursor-default border-transparent' : 'bg-white border border-slate-300 focus:border-indigo-500 outline-none'}`}
            readOnly={!editMode}
            placeholder={editMode ? "0" : ""}
            style={{ minWidth: '100px' }}
          />
        </td>
        <td className="px-4 py-3 text-right text-sm text-slate-600">
          {exchangeRate ? (
            <span className="font-medium text-green-700">
              {formatUSD(usdAmount)}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="px-4 py-3 text-right text-sm font-medium text-slate-600">{percentage}</td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={item.note || ''}
            onChange={(e) => updateItem(item.id, 'note', e.target.value, isDirect)}
            className={`w-full text-left px-3 py-2 rounded text-sm ${!editMode ? 'bg-transparent cursor-default border-transparent' : 'bg-white border border-slate-300 focus:border-indigo-500 outline-none'}`}
            readOnly={!editMode}
            placeholder={editMode ? "비고" : ""}
          />
        </td>
      </tr>
    );
  };

  const renderHeaderRow = (title: string, type: 'indirect' | 'direct') => (
    <tr className="bg-slate-100 font-bold">
      <td className="px-4 py-3"></td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          {editMode && (
            <button
              onClick={() => addRow(type)}
              className="text-indigo-600 hover:text-indigo-800 text-lg font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-indigo-50"
              title="항목 추가"
            >
              +
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3"></td>
      <td className="px-4 py-3"></td>
      <td className="px-4 py-3"></td>
      <td className="px-4 py-3"></td>
    </tr>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
            isAnimating ? 'bg-opacity-40' : 'bg-opacity-0'
          }`}
          onClick={handleClose}
        ></div>
        <div className="fixed inset-y-0 right-0 flex max-w-full">
          <div className={`w-screen max-w-5xl transform transition-transform duration-300 ease-in-out ${
            isAnimating ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full flex flex-col bg-white shadow-xl">
              <header className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">2025년 {localData.month}월 OPEX 상세</h3>
                  </div>
                  <button
                    onClick={handleClose}
                    className="ml-3 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">닫기</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">기준 직원수</p>
                    <p className="font-semibold text-indigo-600">{localData.employeeCount} 명</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">USD/KRW 환율</p>
                    {loadingExchangeRate ? (
                      <p className="font-semibold text-gray-400">로딩중...</p>
                    ) : exchangeRate ? (
                      <div>
                        <p className="font-semibold">{formatCurrency(exchangeRate.usdToKrw.rate)}</p>
                        {exchangeRate.usdToKrw.change !== undefined && (
                          <p className={`text-xs ${exchangeRate.usdToKrw.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {exchangeRate.usdToKrw.change >= 0 ? '↑' : '↓'} {Math.abs(exchangeRate.usdToKrw.change).toFixed(2)}%
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-400">-</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Indirect opex</p>
                    <p className="font-semibold">{formatCurrency(indirectTotal)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">direct opex</p>
                    <p className="font-semibold">{formatCurrency(directTotal)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">OPEX 합계</p>
                    <p className="font-bold text-indigo-600">{formatCurrency(total)}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  {localData.confirmed && !editMode ? (
                    <button
                      onClick={handleEdit}
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
                    >
                      수정
                    </button>
                  ) : editMode ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        title="저장"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      >
                        확정
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleConfirm}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      확정
                    </button>
                  )}
                </div>
              </header>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm table-fixed min-w-[1000px]">
                    <colgroup>
                      <col className="w-[60px]" />
                      <col className="w-[200px]" />
                      <col className="w-[160px]" />
                      <col className="w-[140px]" />
                      <col className="w-[80px]" />
                      <col className="w-[160px]" />
                    </colgroup>
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-center">NO</th>
                        <th className="px-4 py-3 text-left">항목</th>
                        <th className="px-4 py-3 text-right">비용 (원)</th>
                        <th className="px-4 py-3 text-right">달러 환산</th>
                        <th className="px-4 py-3 text-right">비중</th>
                        <th className="px-4 py-3 text-left">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderHeaderRow('Indirect Opex', 'indirect')}
                      {indirectItems.map((item, index) => renderItemRow(item, false, index))}
                      {renderHeaderRow('Direct Opex', 'direct')}
                      {directItems.map((item, index) => renderItemRow(item, true, index))}
                      <tr className="bg-slate-200 font-bold text-base border-t-2 border-slate-300">
                        <td className="px-4 py-4"></td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-bold text-slate-800">Monthly Total Expense</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-right font-bold text-indigo-600 text-base break-all">
                            {formatCurrency(total)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-green-700">
                          {exchangeRate ? (
                            <span>
                              ${new Intl.NumberFormat('en-US').format(Math.round(total / exchangeRate.usdToKrw.rate))}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-slate-800">100%</td>
                        <td className="px-4 py-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpexDetailModal;