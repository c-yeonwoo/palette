/**
 * Authentication Service
 * Handles OAuth2 login, token refresh, and user authentication
 */

import API_CONFIG from '../config/api.config';
import { tokenStorage, type AuthTokens } from './tokenStorage';

export interface AuthUser {
  userId: string;
  nickname: string;
  /** backend AccountType enum: REGULAR 또는 MATCHMAKER_ONLY */
  accountType: 'REGULAR' | 'MATCHMAKER_ONLY';
  isProfileCompleted: boolean;
  canAccessMatchingService: boolean;
  canAccessMatchmakerService: boolean;
  realName: string;
  birthDate: string;
  gender: string;
  phoneNumber?: string;
  isPhoneVerified: boolean;
  /**
   * 데모(시드) 계정 여부 — backend `SeedUserPolicy.isSeed(user)` 결과.
   * frontend 는 더 이상 mock 데이터를 노출하지 않으므로 이 플래그로 분기하지 않는다.
   * (호환을 위해 응답 필드만 유지)
   */
  isMockDataAccount?: boolean;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  refreshExpiresAt: string;
}

export const authService = {
  /**
   * Redirect to Kakao OAuth2 login
   */
  loginWithKakao(): void {
    window.location.href = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OAUTH2.KAKAO}`;
  },

  /**
   * Redirect to Apple OAuth2 login
   */
  loginWithApple(): void {
    window.location.href = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OAUTH2.APPLE}`;
  },

  /**
   * Get current authenticated user info
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const accessToken = tokenStorage.getAccessToken();

    if (!accessToken) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.ME}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.getCurrentUser();
          }
        }
        throw new Error('Failed to get current user');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        tokenStorage.clearTokens();
        return false;
      }

      const data: RefreshTokenResponse = await response.json();
      tokenStorage.setTokens(data);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      tokenStorage.clearTokens();
      return false;
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const accessToken = tokenStorage.getAccessToken();

    if (accessToken) {
      try {
        await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }

    tokenStorage.clearTokens();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenStorage.isAuthenticated();
  },
};
