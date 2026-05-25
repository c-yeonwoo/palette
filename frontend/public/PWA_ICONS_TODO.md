# PWA 아이콘 교체 가이드

> 현재 `pwa-icon.svg` 는 임시 placeholder.
> 정식 출시 전 디자이너가 만든 PNG 로 교체할 것.

## 필요한 파일 (모두 `frontend/public/` 에 배치)

| 파일명 | 크기 | 용도 |
|---|---|---|
| `pwa-192x192.png` | 192×192 | Android 홈 아이콘 |
| `pwa-512x512.png` | 512×512 | Android 적응형 아이콘 + 스플래시 |
| `pwa-512x512-maskable.png` | 512×512 | Android 적응형 (안전 영역 80%) |
| `apple-touch-icon.png` | 180×180 | iOS 홈 아이콘 |
| `favicon.ico` | 32×32, 16×16 | 브라우저 탭 |
| `og-image.png` | 1200×630 | 카카오톡 / SNS 공유 미리보기 |

## 빠른 생성 방법

### 옵션 1: 온라인 도구 (5분)
1. https://realfavicongenerator.net 접속
2. 마스터 이미지 업로드 (512×512 이상)
3. 옵션 설정 → "Generate" → 다운로드
4. 압축 풀고 `public/` 에 복사

### 옵션 2: CLI 도구
```bash
npx pwa-asset-generator <source-icon.png> public/ \
  --manifest src/manifest.json \
  --background "#ffffff" \
  --theme-color "#F97316"
```

### 옵션 3: 디자이너에게 요청 (권장)
스펙: 위 표대로 + 다음 조건
- 정사각형 비율
- 가운데 안전 영역 80% (maskable 용)
- 메인 컬러: 오렌지 #F97316 → 핑크 #EC4899 그라데이션
- 모티프: 팔레트 + 4가지 컬러 닷

## 교체 후 vite.config.ts 수정

```typescript
icons: [
  { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
  { src: 'pwa-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
],
```

그 다음 `npm run build` 로 빌드 검증.
