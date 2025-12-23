/**
 * API Configuration
 * Contains base URLs and endpoints for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
