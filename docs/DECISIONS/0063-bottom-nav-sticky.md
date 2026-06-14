# 0063 — 하단 네비 fixed→sticky (프레임 스크롤 시 딸려 올라가는 버그)

- **상태**: Accepted
- **결정일**: 2026-06-14
- **결정자**: ys.choi
- **선행**: ADR 0061(네비 여백), mobile-frame.css(데스크탑 모바일 프레임)

## 컨텍스트

데스크탑에서 사용자 앱은 `.app-frame`(430px 모바일 목업)으로 감싸진다. 이 프레임은 `position:fixed` 자식을 프레임 안에 가두려고 `transform: translateZ(0)` 를 쓰고, 동시에 `overflow-y:auto; height:100dvh` 스크롤 컨테이너다.

문제: **`transform` 으로 containing block 이 된 스크롤 컨테이너 안의 `position:fixed` 는 `absolute` 처럼 동작해 콘텐츠와 함께 스크롤된다.** 그래서 하단 네비(`fixed bottom-0`)가 스크롤 시 콘텐츠에 묶여 화면 중간으로 "딸려 올라가는" 버그가 발생했다.

프리뷰 probe 로 확정:
- `fixed bottom-0` 자식: scrollTop 0 → bottom=800(정상), 800px 스크롤 → bottom=0 (콘텐츠와 같이 800px 올라감). ❌
- `sticky bottom-0` 자식: scrollTop 0 → 800, 800px 스크롤 → 800 (스크롤포트 하단 고정). ✅
- (모바일 <768px 은 프레임 스타일 off → `fixed` 가 뷰포트에 정상 고정이었으나, 데스크탑 프레임에서만 깨졌음)

## 결정

하단 네비를 `position: fixed bottom-0 left-0 right-0` → **`position: sticky bottom-0`** 로 변경.
- sticky 는 가장 가까운 스크롤 컨테이너(`.app-frame` 데스크탑 / window 모바일) 하단에 고정되며, transform containing block 영향을 받지 않는다.
- 네비는 루트 `min-h-screen` div 의 마지막 flow 자식이라 스크롤 높이가 충분해 sticky 가 항상 하단에 붙는다.
- `.app-frame` 의 `transform` 은 **유지** — 모달/오버레이(`fixed`)를 프레임 안에 가두는 역할은 그대로 필요하고, sticky 네비는 거기 영향받지 않으므로 양립.

## 검증
- 프리뷰 probe(900px 프레임): sticky 가 스크롤 후에도 뷰포트 하단 유지.
- `npm run build` + `vitest run` 39 passed.
