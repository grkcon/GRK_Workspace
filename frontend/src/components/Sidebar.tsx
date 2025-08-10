import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      path: '/employees',
      title: '인사 관리',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      path: '/schedule',
      title: '일정 관리',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    },
    {
      path: '/opex',
      title: 'OPEX 관리',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    {
      path: '/attendance',
      title: '출퇴근 관리',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>
      )
    },
    {
      path: '/ppe',
      title: 'PPE 분석',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" x2="16" y1="2" y2="6"></line>
          <line x1="8" x2="8" y1="2" y2="6"></line>
          <line x1="3" x2="21" y1="10" y2="10"></line>
        </svg>
      )
    }
  ];

  return (
    <aside className="w-20 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col items-center py-4 space-y-4">
      <Link to="/" className="h-10 w-10 flex items-center justify-center bg-slate-800 text-white font-bold rounded-lg text-lg">
        G
      </Link>
      <nav className="flex flex-col items-center space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            title={item.title}
            className={`h-12 w-12 flex items-center justify-center rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {item.icon}
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <div className="group relative">
          <div className="h-10 w-10 rounded-full cursor-pointer border-2 border-transparent group-hover:border-indigo-300 transition-colors overflow-hidden bg-gray-200 flex items-center justify-center">
            {user?.profilePicture ? (
              <img
                className="h-full w-full object-cover"
                src={user.profilePicture}
                alt="User avatar"
                title={user?.name || 'User'}
                onError={(e) => {
                  console.log('Image load error:', e);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-gray-500 font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="absolute bottom-12 left-16 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white shadow-xl rounded-lg py-3 px-4 z-[100] border border-slate-200 w-64">
            {/* 화살표 */}
            <div className="absolute -left-2 bottom-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-white"></div>
            <div className="absolute -left-[9px] bottom-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-slate-200"></div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                {user?.profilePicture ? (
                  <img
                    className="h-full w-full object-cover"
                    src={user.profilePicture}
                    alt="User avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-gray-500 font-semibold text-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mb-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user?.role === 'ADMIN' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user?.role === 'ADMIN' ? '관리자' : '일반 사용자'}
              </span>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;