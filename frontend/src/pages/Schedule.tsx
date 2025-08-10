import React, { useState, useEffect } from 'react';

interface PersonalSchedule {
  id: number;
  title: string;
  start: string;
  end: string;
  type: 'MEETING' | 'PROJECT' | 'LEAVE' | 'TRAINING' | 'OTHER';
  description?: string;
  location?: string;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}

const Schedule: React.FC = () => {
  const [schedules] = useState<PersonalSchedule[]>([]); // 빈 배열로 시작
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      'MEETING': 'bg-blue-100 text-blue-800 border-blue-200',
      'PROJECT': 'bg-green-100 text-green-800 border-green-200',
      'LEAVE': 'bg-red-100 text-red-800 border-red-200',
      'TRAINING': 'bg-purple-100 text-purple-800 border-purple-200',
      'OTHER': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.OTHER;
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      'MEETING': '회의',
      'PROJECT': '프로젝트',
      'LEAVE': '휴가',
      'TRAINING': '교육',
      'OTHER': '기타'
    };
    return labels[type as keyof typeof labels] || '기타';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">확정</span>;
      case 'TENTATIVE':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">예정</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">취소</span>;
      default:
        return null;
    }
  };

  // 오늘의 일정 필터링
  const todaySchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.start).toDateString();
    const today = new Date().toDateString();
    return scheduleDate === today && schedule.status !== 'CANCELLED';
  });

  // 이번 주 일정 필터링
  const thisWeekSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.start);
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return scheduleDate >= weekStart && scheduleDate <= weekEnd && schedule.status !== 'CANCELLED';
  });

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">내 일정</h1>
        <p className="text-slate-500 mt-1">나의 일정을 확인할 수 있습니다.</p>
      </header>

      {/* 뷰 모드 선택 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          {(['month', 'week', 'day'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                viewMode === mode
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {mode === 'month' ? '월간' : mode === 'week' ? '주간' : '일간'}
            </button>
          ))}
        </div>
        <div className="text-lg font-semibold text-slate-700">
          {formatDate(currentDate)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 오늘의 일정 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">오늘의 일정</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {todaySchedules.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                  </svg>
                  <p className="font-medium">오늘 일정이 없습니다.</p>
                  <p className="text-sm text-slate-400 mt-1">편안한 하루 되세요!</p>
                </div>
              ) : (
                todaySchedules.map((schedule) => (
                  <div key={schedule.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-slate-800">{schedule.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getEventTypeColor(schedule.type)}`}>
                            {getEventTypeLabel(schedule.type)}
                          </span>
                          {getStatusBadge(schedule.status)}
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span>🕐 {formatTime(schedule.start)} - {formatTime(schedule.end)}</span>
                            {schedule.location && <span>📍 {schedule.location}</span>}
                          </div>
                          {schedule.description && (
                            <p className="text-slate-500 mt-1">{schedule.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 이번 주 일정 요약 */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">이번 주 일정</h3>
            </div>
            <div className="p-4 space-y-3">
              {thisWeekSchedules.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">이번 주 일정이 없습니다.</p>
                </div>
              ) : (
                thisWeekSchedules.slice(0, 5).map((schedule) => (
                  <div key={schedule.id} className="pb-3 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-400 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{schedule.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(schedule.start).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {formatTime(schedule.start)}
                        </p>
                      </div>
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded border ${getEventTypeColor(schedule.type)}`}>
                        {getEventTypeLabel(schedule.type)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {thisWeekSchedules.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-slate-500">+{thisWeekSchedules.length - 5}개 더</span>
                </div>
              )}
            </div>
          </div>

          {/* 빠른 통계 */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-4 mt-4">
            <h4 className="font-semibold text-slate-800 mb-3">이번 주 통계</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">전체 일정</span>
                <span className="font-semibold text-slate-800">{thisWeekSchedules.length}개</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">회의</span>
                <span className="font-semibold text-slate-800">
                  {thisWeekSchedules.filter(s => s.type === 'MEETING').length}개
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">프로젝트</span>
                <span className="font-semibold text-slate-800">
                  {thisWeekSchedules.filter(s => s.type === 'PROJECT').length}개
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 전체 일정 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-6">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">전체 일정</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {schedules.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
              </svg>
              <p className="font-medium text-lg mb-1">등록된 일정이 없습니다.</p>
              <p className="text-sm">새로운 일정이 추가되면 여기에 표시됩니다.</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-slate-800">{schedule.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getEventTypeColor(schedule.type)}`}>
                        {getEventTypeLabel(schedule.type)}
                      </span>
                      {getStatusBadge(schedule.status)}
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex items-center space-x-4">
                        <span>📅 {new Date(schedule.start).toLocaleDateString('ko-KR')}</span>
                        <span>🕐 {formatTime(schedule.start)} - {formatTime(schedule.end)}</span>
                        {schedule.location && <span>📍 {schedule.location}</span>}
                      </div>
                      {schedule.description && (
                        <p className="text-slate-500 mt-1">{schedule.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default Schedule;