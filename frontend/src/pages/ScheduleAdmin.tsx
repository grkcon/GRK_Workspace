import React, { useState, useEffect } from 'react';

interface Employee {
  id: number;
  name: string;
  department: string;
  position: string;
}

interface ScheduleEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  type: 'MEETING' | 'PROJECT' | 'LEAVE' | 'TRAINING' | 'OTHER';
  employeeId: number;
  employeeName: string;
  description?: string;
  location?: string;
}

interface ScheduleModalProps {
  isOpen: boolean;
  event?: ScheduleEvent | null;
  onClose: () => void;
  onSave: (event: Partial<ScheduleEvent>) => void;
  employees: Employee[];
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, event, onClose, onSave, employees }) => {
  const [formData, setFormData] = useState<{
    title: string;
    start: string;
    end: string;
    type: 'MEETING' | 'PROJECT' | 'LEAVE' | 'TRAINING' | 'OTHER';
    employeeId: string;
    description: string;
    location: string;
  }>({
    title: '',
    start: '',
    end: '',
    type: 'MEETING',
    employeeId: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        start: event.start,
        end: event.end,
        type: event.type,
        employeeId: event.employeeId.toString(),
        description: event.description || '',
        location: event.location || ''
      });
    } else {
      setFormData({
        title: '',
        start: '',
        end: '',
        type: 'MEETING',
        employeeId: '',
        description: '',
        location: ''
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      employeeId: parseInt(formData.employeeId),
      id: event?.id
    });
  };

  if (!isOpen) return null;

  const eventTypeOptions = [
    { value: 'MEETING', label: '회의', color: 'bg-blue-100 text-blue-800' },
    { value: 'PROJECT', label: '프로젝트', color: 'bg-green-100 text-green-800' },
    { value: 'LEAVE', label: '휴가', color: 'bg-red-100 text-red-800' },
    { value: 'TRAINING', label: '교육', color: 'bg-purple-100 text-purple-800' },
    { value: 'OTHER', label: '기타', color: 'bg-gray-100 text-gray-800' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl relative z-10">
        <header className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg">{event ? '일정 수정' : '새 일정 추가'}</h3>
        </header>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">담당자</label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">담당자 선택</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">유형</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as 'MEETING' | 'PROJECT' | 'LEAVE' | 'TRAINING' | 'OTHER'})}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {eventTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">시작일시</label>
              <input
                type="datetime-local"
                value={formData.start}
                onChange={(e) => setFormData({...formData, start: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">종료일시</label>
              <input
                type="datetime-local"
                value={formData.end}
                onChange={(e) => setFormData({...formData, end: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">장소</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="회의실, 장소 등"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">상세 내용</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="일정에 대한 상세 설명..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              {event ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ScheduleAdmin: React.FC = () => {
  const [events] = useState<ScheduleEvent[]>([]); // 빈 배열로 시작
  const [employees] = useState<Employee[]>([]); // 빈 배열로 시작
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const openModal = (event?: ScheduleEvent) => {
    setSelectedEvent(event || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(false);
  };

  const handleSaveEvent = (eventData: Partial<ScheduleEvent>) => {
    // TODO: API 호출로 일정 저장
    console.log('Save event:', eventData);
    alert('일정이 저장되었습니다.');
    closeModal();
  };

  const handleDeleteEvent = (eventId: number) => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      // TODO: API 호출로 일정 삭제
      console.log('Delete event:', eventId);
      alert('일정이 삭제되었습니다.');
    }
  };

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

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">일정 관리 (Admin)</h1>
          <p className="text-slate-500 mt-1">전 직원의 일정을 관리하고 새로운 일정을 등록할 수 있습니다.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
        >
          + 새 일정
        </button>
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

      {/* 일정 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">전체 일정 목록</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {events.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-medium text-lg mb-1">등록된 일정이 없습니다.</p>
              <p className="text-sm">새 일정을 추가해보세요.</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-slate-800">{event.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getEventTypeColor(event.type)}`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex items-center space-x-4">
                        <span>📅 {formatTime(event.start)} - {formatTime(event.end)}</span>
                        <span>👤 {event.employeeName}</span>
                        {event.location && <span>📍 {event.location}</span>}
                      </div>
                      {event.description && (
                        <p className="text-slate-500 mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openModal(event)}
                      className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ScheduleModal
        isOpen={isModalOpen}
        event={selectedEvent}
        onClose={closeModal}
        onSave={handleSaveEvent}
        employees={employees}
      />
    </div>
  );
};

export default ScheduleAdmin;