/**
 * Token Storage Utility
 * Manages JWT tokens in localStorage
 */

const TOKEN_KEY = 'palette_access_token';
const REFRESH_TOKEN_KEY = 'palette_refresh_token';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  refreshExpiresAt: string;
}

export const tokenStorage = {
  /**
   * Save tokens to localStorage
   */
  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(`${TOKEN_KEY}_expires_at`, tokens.expiresAt);
    localStorage.setItem(`${REFRESH_TOKEN_KEY}_expires_at`, tokens.refreshExpiresAt);
  },

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Get token expiry time
   */
  getAccessTokenExpiry(): Date | null {
    const expiresAt = localStorage.getItem(`${TOKEN_KEY}_expires_at`);
    return expiresAt ? new Date(expiresAt) : null;
  },

  /**
   * Check if access token is expired
   */
  isAccessTokenExpired(): boolean {
    const expiry = this.getAccessTokenExpiry();
    if (!expiry) return true;
    return new Date() >= expiry;
  },

  /**
   * Clear all tokens from localStorage
   */
  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(`${TOKEN_KEY}_expires_at`);
    localStorage.removeItem(`${REFRESH_TOKEN_KEY}_expires_at`);
  },

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!(accessToken || refreshToken);
  },
};
