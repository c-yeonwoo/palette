import { useEffect } from 'react';
import { tokenStorage } from '../../lib/auth/tokenStorage';
import { clearBetaPassed } from './BetaGateScreen';

interface OAuth2RedirectHandlerProps {
  onSuccess: (isNewUser: boolean, missingFields?: string[]) => void;
  onError: () => void;
  /** 베타 게이트 미통과 — 게이트 화면으로 복귀 */
  onBetaRequired?: () => void;
}

export function OAuth2RedirectHandler({ onSuccess, onError, onBetaRequired }: OAuth2RedirectHandlerProps) {
  useEffect(() => {
    const handleOAuth2Redirect = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');

        if (error) {
          window.history.replaceState({}, document.title, '/');
          if (error === 'invalid_beta_code') {
            clearBetaPassed();
            onBetaRequired?.();
            return;
          }
          onError();
          return;
        }

        const accessToken = params.get('token');
        const refreshToken = params.get('refreshToken');
        const isNewUser = params.get('isNewUser') === 'true';
        const missingFieldsParam = params.get('missingFields');

        if (!accessToken || !refreshToken) {
          console.error('Missing tokens in OAuth2 redirect');
          onError();
          return;
        }

        const missingFields = missingFieldsParam
          ? missingFieldsParam.split(',').map(field => field.trim())
          : [];

        const now = new Date();
        const accessTokenExpiry = new Date(now.getTime() + 3600 * 1000);
        const refreshTokenExpiry = new Date(now.getTime() + 2592000 * 1000);

        tokenStorage.setTokens({
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresAt: accessTokenExpiry.toISOString(),
          refreshExpiresAt: refreshTokenExpiry.toISOString(),
        });

        window.history.replaceState({}, document.title, '/');
        onSuccess(isNewUser, missingFields);
      } catch (error) {
        console.error('Error handling OAuth2 redirect:', error);
        onError();
      }
    };

    handleOAuth2Redirect();
  }, [onSuccess, onError, onBetaRequired]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-muted-foreground">로그인 처리 중...</p>
      </div>
    </div>
  );
}
