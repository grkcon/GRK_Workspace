import React, { useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginWithCustomButtonProps {
  clientId: string;
}

const LoginButton: React.FC = () => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  // Mock 로그인 제거됨

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse: any) => {
      try {
        console.log('Google OAuth Success:', tokenResponse);
        
        // Access Token으로 Google API에서 사용자 정보 가져오기
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`
        );
        const userInfo = await userInfoResponse.json();
        console.log('User Info:', userInfo);
        
        // 도메인 검증을 프론트엔드에서도 수행
        if (!userInfo.email?.endsWith('@grkcon.com')) {
          alert('grkcon.com 도메인 이메일만 로그인 가능합니다.');
          return;
        }
        
        console.log('실제 Google 사용자 정보:', userInfo);
        
        await googleLogin(tokenResponse.access_token);
        navigate('/');
      } catch (error: any) {
        console.error('Login failed:', error);
        alert('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    },
    onError: (error) => {
      console.error('Google OAuth Failed:', error);
      alert('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    },
    scope: 'email profile',
  });

  return (
    <button
      onClick={() => login()}
      className="w-full inline-flex items-center justify-center py-3 px-5 border border-transparent rounded-lg shadow-sm bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
    >
      {/* Google Logo SVG */}
      <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.438,36.333,48,31,48,24C48,22.659,47.862,21.35,47.611,20.083z"></path>
      </svg>
      Google 계정으로 로그인
    </button>
  );
};

const LoginWithCustomButton: React.FC<LoginWithCustomButtonProps> = ({ clientId }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 디버깅: clientId 확인
  console.log('LoginWithCustomButton received clientId:', clientId);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">GRK Workspace</h1>
            <p className="text-slate-600 mt-2">관리 시스템</p>
          </div>

          {/* 로그인 카드 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 md:p-10">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-700">로그인</h2>
              <p className="text-sm text-slate-500 mt-1">@grkcon.com 계정으로 로그인하세요</p>
            </div>

            {/* 커스텀 구글 로그인 버튼 */}
            <div className="mt-8">
              <LoginButton />
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-slate-500">
            <p>&copy; 2025 GRK Workspace. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginWithCustomButton;