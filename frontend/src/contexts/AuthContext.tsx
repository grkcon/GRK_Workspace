import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, CurrentUser, AuthResponse } from '../services/authApi';

interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  googleLogin: (accessToken: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
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

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleAuthSuccess = (response: AuthResponse) => {
    setUser(response.user);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const googleLogin = async (accessToken: string) => {
    try {
      const response = await authApi.googleAuth({ accessToken });
      handleAuthSuccess(response);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Google 세션도 정리 (계정 선택 강제)
    if ((window as any).google) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        googleLogin,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};