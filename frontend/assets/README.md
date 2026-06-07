# Capacitor Assets — 앱 아이콘 / 스플래시

> `@capacitor/assets` 가 이 폴더의 원본 이미지로부터 iOS/Android 의 모든 아이콘·스플래시 변형을 자동 생성한다.

## 필요한 원본 (디자이너가 제공)

| 파일명 | 크기 | 용도 |
|---|---|---|
| `icon.png`              | 1024×1024 | 앱 아이콘 (라이트) — 라운드 처리는 OS가 함, 풀 사각형으로 |
| `icon-foreground.png`   | 1024×1024 | Android 적응형 아이콘 전경 — 가운데 ~70% 영역만 사용 |
| `icon-background.png`   | 1024×1024 | Android 적응형 아이콘 배경 — 단색 또는 단순 패턴 |
| `splash.png`            | 2732×2732 | 스플래시 — 중앙에 로고, 여백 넉넉히 |
| `splash-dark.png`       | 2732×2732 | 다크 모드 스플래시 (선택) |

## 생성 명령

```bash
cd frontend
npx capacitor-assets generate --iconBackgroundColor '#F4EFE7' --splashBackgroundColor '#F4EFE7'
```

생성물:
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/*.png`
- `ios/App/App/Assets.xcassets/Splash.imageset/*.png`
- `android/app/src/main/res/mipmap-*/ic_launcher*.png`
- `android/app/src/main/res/drawable*/splash.png`

## 베타 단계

`pwa-icon.svg` 로 1024px PNG 1장만 임시 생성해도 OK. 정식 출시 전 디자이너 자산으로 교체.
