import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 네이티브 셸 설정. ADR 0040.
 *
 * 패키징: webDir(=dist) 의 SPA 를 iOS WKWebView / Android WebView 로 감싼다.
 * 백엔드 API 는 같은 origin 이 아니므로 server.url 미사용 — 프론트 fetch 는
 * apiBaseUrl 환경변수(빌드 타임 주입)로 절대 URL 호출.
 *
 * 번들 ID:
 *   iOS:     kr.ai.palette
 *   Android: kr.ai.palette
 * 변경 시 App Store Connect / Play Console 등록 ID 와 일치 필요.
 */
const config: CapacitorConfig = {
  appId: 'kr.ai.palette',
  appName: '팔레트',
  webDir: 'dist',
  // iOS 13+ / Android 7+ (API 24+) 대상 (Apple 최저 기준 / 데이팅 카테고리 표준)
  ios: {
    contentInset: 'always',
    scheme: 'palette',
    // 카카오/Apple Sign In 콜백 처리를 위한 URL 스킴.
    // 카카오 콜백은 kakao{appKey}://oauth 형식 — 별도 LSApplicationQueriesSchemes 등록.
  },
  android: {
    allowMixedContent: false,    // HTTPS 강제 (Play Console 권장)
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: '#F4EFE7',   // brand cream
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'DARK',                // 밝은 배경에 어두운 글자
      backgroundColor: '#F4EFE7',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
