# 0034 — 피드 카드 사진/소개 분리 + 닉네임·나이 노출 + 알림 화면 통일

- **상태**: Accepted
- **결정일**: 2026-06-07
- **결정자**: ys.choi

## 결정

### 1. 피드 카드 = 사진 + 소개 섹션 분리
- 사진 위 dim 그라디언트·오버레이 텍스트 제거. 사진은 위쪽만 라운드(`rounded-t-2xl`), **바로 밑에 소개 섹션을 이어 붙임**(`rounded-b-2xl`).
- 소개 섹션 3줄: **닉네임 / 직업군 / 나이 · 지역**.
- 소개 섹션 배경 = **상대 팔레트 컬러 파스텔**(`${hex}1F` ≈ 12%), 색 없으면 surface-sunken. (흰색 대신 — "팔레트" 색 정체성 강화. 흰색 전환은 한 줄.)
- 공개 전엔 물감 커버만(카드 작게), 공개 후 소개 섹션이 붙어 카드가 커짐.
- ProfileCard·AiSignalCard(팔레트 Pick) 공통 적용 — 공유 `CardInfoSection`.

### 2. 피드 응답에 닉네임·나이 추가 (백엔드)
- `FeedProfileItem`에 `nickname`(user.publicInfo.nickname) + `age`(getAge()) 추가. 기존엔 dating profile에 닉네임/나이가 없어 카드에 표기 불가였음.
- 팔레트 Pick 카드는 닉네임 미제공(ai-signal 응답에 없음) → 닉네임 줄 생략, 나이는 teaserAge 사용.

### 3. 알림 화면 통일
- 상단 헤더를 **흰색 sticky 통일 스타일**(`bg-card/95 backdrop-blur`, h-16, text-lg)로 변경.
- **카테고리 탭 제거** — 전체 알림을 하나의 리스트로 쌓음(activeTab="all" 고정).

## 결과

- 카드가 사진/소개로 명확히 분리, 닉네임·나이·직업·지역 노출. 알림은 흰 헤더 + 단일 리스트.
- compileKotlin / vite build / vitest(40) 통과.

## 메모

- 소개 섹션은 `revealed`(플립 완료) 후 표시 — 카드 높이가 늘어남(2-col 그리드에서 자연스러움).
- NotificationScreen의 TABS/tabUnread는 미사용으로 남음(후속 정리 가능).
