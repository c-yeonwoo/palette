/**
 * API Configuration
 * Contains base URLs and endpoints for backend communication.
 *
 * 기본값: '' (빈 문자열) → 상대경로로 동일 origin 호출
 *   - prod (https://www.palette.ai.kr): nginx 가 /api/* 를 backend 로 proxy
 *   - dev (vite dev server): vite proxy 또는 직접 백엔드 호출
 *
 * 로컬 개발 시 백엔드가 다른 host/port 라면:
 *   VITE_API_BASE_URL=http://localhost:8080 npm run dev
 */

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? '';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      ME: '/api/v1/auth/me',
      REFRESH: '/api/v1/auth/refresh',
      LOGOUT: '/api/v1/auth/logout',
    },
    OAUTH2: {
      KAKAO: '/oauth2/authorization/kakao',
      APPLE: '/oauth2/authorization/apple',
    },
  },
} as const;

export default API_CONFIG;
