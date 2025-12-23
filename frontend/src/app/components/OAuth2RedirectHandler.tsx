import { useEffect } from 'react';
import { tokenStorage } from '../../lib/auth/tokenStorage';

interface OAuth2RedirectHandlerProps {
  onSuccess: (isNewUser: boolean) => void;
  onError: () => void;
}

export function OAuth2RedirectHandler({ onSuccess, onError }: OAuth2RedirectHandlerProps) {
  useEffect(() => {
    const handleOAuth2Redirect = () => {
      try {
        // Parse URL parameters
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('token');
        const refreshToken = params.get('refreshToken');
        const isNewUser = params.get('isNewUser') === 'true';

        if (!accessToken || !refreshToken) {
          console.error('Missing tokens in OAuth2 redirect');
          onError();
          return;
        }

        // Calculate token expiry (default to 1 hour for access, 30 days for refresh)
        const now = new Date();
        const accessTokenExpiry = new Date(now.getTime() + 3600 * 1000); // 1 hour
        const refreshTokenExpiry = new Date(now.getTime() + 2592000 * 1000); // 30 days

        // Save tokens to storage
        tokenStorage.setTokens({
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresAt: accessTokenExpiry.toISOString(),
          refreshExpiresAt: refreshTokenExpiry.toISOString(),
        });

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        // Call success callback
        onSuccess(isNewUser);
      } catch (error) {
        console.error('Error handling OAuth2 redirect:', error);
        onError();
      }
    };

    handleOAuth2Redirect();
  }, [onSuccess, onError]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-muted-foreground">로그인 처리 중...</p>
      </div>
    </div>
  );
}
