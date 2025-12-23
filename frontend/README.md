# Palette Frontend

React 18.3.1 기반의 Palette 데이팅 앱 프론트엔드입니다.

## 기술 스택

- **프레임워크**: React 18.3.1 + TypeScript
- **빌드 도구**: Vite 6.3.5
- **스타일링**: TailwindCSS 4.1.12
- **UI 컴포넌트**: Radix UI (shadcn/ui)
- **폼 관리**: React Hook Form
- **알림**: Sonner (토스트 알림)

## 개발 환경 설정

### 1. 환경 변수 설정

`.env` 파일을 생성하고 백엔드 API URL을 설정하세요:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```
VITE_API_BASE_URL=http://localhost:8080
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## OAuth2 인증 흐름

### 로그인 프로세스

1. 사용자가 로그인 화면에서 "카카오로 시작하기" 버튼 클릭
2. 백엔드 OAuth2 엔드포인트로 리다이렉트: `http://localhost:8080/oauth2/authorization/kakao`
3. 카카오 로그인 페이지에서 사용자 인증
4. 카카오가 백엔드로 인증 코드 전달
5. 백엔드가 JWT 토큰을 생성하고 프론트엔드로 리다이렉트:
   ```
   http://localhost:3000/oauth2/redirect?token={accessToken}&refreshToken={refreshToken}&isNewUser={boolean}
   ```
6. OAuth2RedirectHandler가 토큰을 localStorage에 저장
7. 신규 사용자는 프로필 설정 화면으로, 기존 사용자는 메인 피드로 이동

### 토큰 관리

- **Access Token**: 1시간 유효, API 요청 시 Authorization 헤더에 포함
- **Refresh Token**: 30일 유효, Access Token 만료 시 자동 갱신
- **저장소**: localStorage (`palette_access_token`, `palette_refresh_token`)

### API 호출

모든 API 호출은 `apiClient`를 통해 자동으로 JWT 토큰을 포함합니다:

```typescript
import { api } from '../lib/api/apiClient';

// GET 요청
const user = await api.get('/api/v1/auth/me');

// POST 요청
const result = await api.post('/api/v1/profiles', profileData);
```

## 프로젝트 구조

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── ui/          # Radix UI 기반 공통 컴포넌트
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── OAuth2RedirectHandler.tsx
│   │   │   └── ...
│   │   └── App.tsx          # 메인 앱 컴포넌트
│   └── lib/
│       ├── api/
│       │   └── apiClient.ts      # 인증된 API 클라이언트
│       ├── auth/
│       │   ├── authService.ts    # 인증 서비스
│       │   └── tokenStorage.ts   # 토큰 저장소
│       └── config/
│           └── api.config.ts     # API 설정
├── .env                     # 환경 변수 (gitignore)
├── .env.example            # 환경 변수 예시
└── package.json
```

## 스크린 플로우

### 신규 사용자 (isNewUser = true)
1. Login Screen
2. Basic Info Screen (이름, 나이, 성별 등)
3. Photo Upload Screen
4. About Me Screen (자기소개)
5. Ideal Type Screen (이상형)
6. AI Profile Enhance Screen (AI 프로필 강화)
7. Main Feed Screen

### 기존 사용자 (isNewUser = false)
1. Login Screen
2. Main Feed Screen (바로 이동)

## 개발 가이드

### 새로운 API 엔드포인트 추가

1. `src/lib/config/api.config.ts`에 엔드포인트 추가:
```typescript
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: { ... },
    PROFILE: {
      GET: '/api/v1/profiles',
      UPDATE: '/api/v1/profiles',
    },
  },
};
```

2. API 클라이언트 사용:
```typescript
const profile = await api.get(API_CONFIG.ENDPOINTS.PROFILE.GET);
```

### 인증이 필요 없는 API 호출

```typescript
const data = await api.get('/api/v1/public/data', { requiresAuth: false });
```

## 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 프로덕션 미리보기

```bash
npm run preview
```

## 트러블슈팅

### CORS 에러

백엔드 SecurityConfig에서 CORS 설정을 확인하세요:
```kotlin
http.cors { it.configurationSource {
    CorsConfiguration().apply {
        allowedOrigins = listOf("http://localhost:3000")
        allowedMethods = listOf("*")
        allowedHeaders = listOf("*")
    }
}}
```

### 토큰 만료

`apiClient`가 자동으로 토큰을 갱신합니다. 갱신 실패 시 자동으로 로그인 화면으로 리다이렉트됩니다.

### OAuth2 리다이렉트 실패

1. 백엔드 `application.yml`의 `app.oauth2.redirect-uri` 확인
2. 카카오 개발자 콘솔의 Redirect URI 설정 확인
3. 백엔드가 `http://localhost:8080`에서 실행 중인지 확인
4. 프론트엔드가 `http://localhost:3000`에서 실행 중인지 확인

## 테스트

### E2E OAuth2 로그인 테스트

1. 백엔드 실행 (포트 8080)
2. 프론트엔드 실행 (포트 3000)
3. `http://localhost:3000` 접속
4. "카카오로 시작하기" 버튼 클릭
5. 카카오 로그인 완료
6. OAuth2 리다이렉트 처리 확인
7. 토큰이 localStorage에 저장되었는지 확인 (개발자 도구 > Application > Local Storage)
8. 프로필 설정 화면 또는 메인 피드로 이동 확인

## 다음 단계

- [ ] 프로필 API 연동
- [ ] 매칭 피드 API 연동
- [ ] 주선자 대시보드 API 연동
- [ ] 실시간 메시지 기능
- [ ] 이미지 업로드 구현
