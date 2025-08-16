import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, CurrentUser } from '../services/authApi';

// 권한 타입 정의
export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'DEVELOPER';

// 페이지 권한 정의
export interface PagePermission {
  path: string;
  allowedRoles: UserRole[];
}

// 페이지별 권한 설정
const PAGE_PERMISSIONS: PagePermission[] = [
  { path: '/employees', allowedRoles: ['DEVELOPER', 'ADMIN', 'MANAGER'] },
  { path: '/schedule', allowedRoles: ['DEVELOPER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] }, // 개인 캘린더
  { path: '/schedule-admin', allowedRoles: ['DEVELOPER', 'ADMIN', 'MANAGER'] }, // 관리자 캘린더
  { path: '/opex', allowedRoles: ['DEVELOPER', 'ADMIN', 'MANAGER'] },
  { path: '/attendance', allowedRoles: ['DEVELOPER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] }, // 개인 근태
  { path: '/attendance-admin', allowedRoles: ['DEVELOPER', 'ADMIN'] }, // 관리자 근태
  { path: '/ppe', allowedRoles: ['DEVELOPER', 'ADMIN', 'MANAGER'] },
  { path: '/evaluation', allowedRoles: ['DEVELOPER', 'ADMIN', 'MANAGER'] }, // 관리자 평가
  { path: '/evaluation-personal', allowedRoles: ['DEVELOPER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] }, // 개인 평가
  { path: '/cr', allowedRoles: ['DEVELOPER', 'ADMIN', 'MANAGER'] },
];

// 사용자 ID별 권한 매핑
const getUserRole = (email: string): UserRole => {
  // admin 계정은 모든 권한
  if (email === 'admin' || email === 'admin@admin.com') {
    return 'DEVELOPER';
  }
  
  // sungbae는 개발자로 모든 권한
  if (email === 'sungbae@grkcon.com' || email.startsWith('sungbae')) {
    return 'DEVELOPER';
  }
  
  // CEO나 admin 계정들
  if (email.includes('ceo@') || email.includes('admin@')) {
    return 'ADMIN';
  }
  
  // 기본적으로 EMPLOYEE 권한
  return 'EMPLOYEE';
};

interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasPageAccess: (path: string) => boolean;
  getAccessiblePages: () => PagePermission[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const checkAuth = async () => {
    try {
      // SSR 안전성 체크
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (token) {
        // admin-token인 경우 간단 처리
        if (token === 'admin-token') {
          const adminUser: CurrentUser = {
            id: 1,
            email: 'admin',
            name: 'Administrator',
            role: 'ADMIN',
            profilePicture: ''
          };
          setUser(adminUser);
          setIsAuthenticated(true);
          const role = getUserRole('admin');
          setUserRole(role);
        } else {
          // 기존 토큰 처리 (사용하지 않음)
          setUser(null);
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);


  // 권한 관련 함수들
  const hasPageAccess = (path: string): boolean => {
    if (!userRole) return false;
    const permission = PAGE_PERMISSIONS.find(p => p.path === path);
    if (!permission) return true; // 권한 설정이 없는 페이지는 접근 허용
    return permission.allowedRoles.includes(userRole);
  };

  const getAccessiblePages = (): PagePermission[] => {
    if (!userRole) return [];
    return PAGE_PERMISSIONS.filter(permission => 
      permission.allowedRoles.includes(userRole)
    );
  };


  const logout = () => {
    authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
    // SSR 안전성 체크
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        userRole,
        logout,
        checkAuth,
        hasPageAccess,
        getAccessiblePages,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};