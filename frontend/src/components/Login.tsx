import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

interface LoginProps {
  clientId: string;
}

const Login: React.FC<LoginProps> = ({ clientId }) => {
  const handleLoginSuccess = (credentialResponse: any) => {
    console.log('Login Success:', credentialResponse);
    // TODO: Backend API로 토큰 전송 및 JWT 받기
  };

  const handleLoginError = () => {
    console.error('Login Failed');
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">GRK Workspace</h1>
          </div>

          {/* 로그인 카드 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 md:p-10">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-700">로그인</h2>
              <p className="text-sm text-slate-500 mt-1">Google 계정으로 시작하세요.</p>
            </div>

            {/* 구글 로그인 버튼 */}
            <div className="mt-8 flex justify-center">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                theme="filled_blue"
                size="large"
                width="100%"
                locale="ko"
              />
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

export default Login;