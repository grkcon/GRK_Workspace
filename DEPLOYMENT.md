# GRK Google OAuth 배포 가이드

## 🚀 배포 전 준비사항

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **API 및 서비스 > 사용자 인증 정보** 이동
3. OAuth 2.0 클라이언트 ID 선택

#### 승인된 JavaScript 원본 추가:
```
https://yourdomain.com
https://www.yourdomain.com
```

#### 승인된 리디렉션 URI 추가:
```
https://yourdomain.com
https://yourdomain.com/
https://www.yourdomain.com
https://www.yourdomain.com/
```

### 2. OAuth 동의 화면 설정

1. **OAuth 동의 화면** 메뉴 이동
2. **앱 게시** 버튼 클릭 (테스트 → 프로덕션)
3. Google 검토 프로세스 완료 대기

### 3. 실제 Google OAuth 토큰 검증 구현

현재 백엔드는 모킹 구현을 사용 중입니다. 프로덕션에서는 실제 Google OAuth 검증이 필요합니다.

**backend/src/modules/auth/services/auth.service.ts** 수정:

```typescript
import { OAuth2Client } from 'google-auth-library';

async googleAuth(googleAuthDto: GoogleAuthDto): Promise<AuthResponseDto> {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  try {
    // 실제 Google 토큰 검증
    const ticket = await client.verifyIdToken({
      idToken: googleAuthDto.accessToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    
    // 사용자 생성 또는 업데이트
    let user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      user = this.userRepository.create({
        email,
        name,
        googleId,
        profilePicture: picture,
        role: UserRole.EMPLOYEE,
      });
      await this.userRepository.save(user);
    } else {
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);
    }
    
    return this.generateAuthResponse(user);
  } catch (error) {
    throw new UnauthorizedException('Invalid Google token');
  }
}
```

필요한 패키지 설치:
```bash
npm install google-auth-library
```

### 4. 환경변수 관리

#### 개발/프로덕션 환경변수 분리

**프론트엔드**:
- `.env.development` - 개발용
- `.env.production` - 프로덕션용

**백엔드**:
- `.env.development` - 개발용
- `.env.production` - 프로덕션용

### 5. CORS 설정

**backend/src/main.ts**:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
```

### 6. 보안 체크리스트

- [ ] JWT_SECRET를 강력한 랜덤 키로 변경
- [ ] HTTPS 사용 확인
- [ ] 환경변수가 버전 관리에 포함되지 않도록 확인
- [ ] Google Client Secret이 프론트엔드에 노출되지 않도록 확인

### 7. 네이버 클라우드 플랫폼 배포 시

#### SSL 인증서 설정
- Load Balancer에서 SSL 인증서 적용
- HTTP → HTTPS 리다이렉션 설정

#### 도메인 설정
- DNS 레코드 설정
- A 레코드: 서버 IP 연결

## 📝 배포 후 테스트

1. HTTPS로 접속 확인
2. Google 로그인 테스트
3. JWT 토큰 발급 및 인증 확인
4. API 호출 테스트

## 🔧 트러블슈팅

### 문제: "액세스 차단됨" 오류
- 해결: Google Cloud Console에서 프로덕션 도메인 추가

### 문제: CORS 오류
- 해결: 백엔드 CORS_ORIGIN 환경변수 확인

### 문제: "Invalid token" 오류
- 해결: Google Client ID/Secret 확인