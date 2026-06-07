# 0033 — 주선 대시보드 수익 요약 카드 + 세그먼트 토글 + 바텀시트 슬라이드업 + 본문 폰트 ↑

- **상태**: Accepted
- **결정일**: 2026-06-07
- **결정자**: ys.choi

## 결정

1. **주선 대시보드 수익 요약 카드** — 스크롤 콘텐츠 최상단에 커미션율 / 사용 가능 P / 누적 P 3분할 카드 추가(탭 → 리워드 상세). 등급 strip(등급·진행)과 보완. 골드는 '사용 가능 P' 한 곳만.
2. **남/여 토글 → 홈 세그먼트 스타일** — `bg-surface-sunken p-1 rounded-2xl` 컨테이너 + 활성 `bg-card shadow-card`로 홈 탭 컴포넌트와 통일.
3. **바텀시트 슬라이드업 애니메이션** — 하단에서 올라오는 드로어/시트에 `animate-slide-up`(0.32s, translateY 100%→0) + 백드롭 `animate-fade-in`. 적용: NudgeFlowSheet(연결 제안), AiPassPaywall(팔레트 Pick 패스), 완성도 체크리스트. (중앙 Radix Dialog는 기존 애니메이션 유지)
4. **컴포넌트/폰트 크기 점검(#2)** — 본문 워크호스 `--text-sm` 14→**15px**(line-height 22). 이전 정리(9/10/11px 제거, text-xs 13, caption 13)와 합쳐 최소 13 / 본문 15 / base 16으로 가독성 상향. 13px 미만 하드코딩 텍스트 0건 확인. 컴포넌트(버튼 h-11~h-14, 입력 py-2.5, 하단 아이콘 19px)는 적정.

## 결과

- 대시보드 상단에 수익 요약 1카드. 남/여 토글이 홈과 동일 룩. 바텀시트가 아래에서 부드럽게 상승. 본문 폰트 15px.
- vite build / vitest(40) 통과.

## 메모

- theme.css에 `slide-up` keyframe·`.animate-slide-up` 추가(기존 slide-in-right/fade-in 옆).
- text-sm은 사용처가 많아 +1px가 일부 타이트 레이아웃에 영향 가능 — 시각 점검 권장.
