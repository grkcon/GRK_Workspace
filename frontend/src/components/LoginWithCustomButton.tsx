import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginWithCustomButtonProps {
  clientId?: string; // Optional now
}

const LoginWithCustomButton: React.FC<LoginWithCustomButtonProps> = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === 'admin' && password === 'admin') {
      // 로그인 성공 - 토큰 설정 및 리다이렉트 (SSR 안전)
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', 'admin-token');
        window.location.href = '/';
      }
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="text-center">
              <div className="text-5xl font-bold tracking-wider mb-2">
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">GRK</span>
              </div>
              <div className="text-lg font-light tracking-[0.3em] text-slate-600 uppercase">
                WORKSPACE
              </div>
            </div>
          </div>
          <p className="text-slate-600 mt-4">관리 시스템</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 md:p-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-slate-700">관리자 로그인</h2>
            <p className="text-sm text-slate-500 mt-1">관리자 계정으로 로그인하세요</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="admin"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="admin"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              로그인
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>&copy; 2025 GRK Workspace. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginWithCustomButton;