# 0035 — 프로필 공개 범위(관객 기반) + 소개 요청 받기 항상 ON

- **상태**: Accepted
- **결정일**: 2026-06-07
- **결정자**: ys.choi

## 결정

### 1. "공개 설정" → "공개 범위" + 문구
- 마이페이지 섹션명 변경. 프로필 공개 설명: "지인의 지인이 내 프로필을 볼 수 있어요".

### 2. 소개 요청 받기 = 항상 ON (토글 제거)
- 끌 이유가 없고, 노출 중지는 "프로필 공개 off"로 충분 → `isAcceptingMatches` 토글 UI 제거(기본 true).
- `toggleVisibility`가 숨김 시 `isAcceptingMatches=false`로 만들던 버그를 `show()/hide()`(hiddenAt만 토글)로 수정 — 보이기/숨기기가 다른 설정을 건드리지 않음.

### 3. 공개 범위 = 관객 기반 disclosure (핵심 항상 공개 / 상세는 지인에게 선택)
- **핵심 정보**(키·나이·직업·회사·지역): 모두에게 항상 공개 (지인이 거짓 검증).
- **상세**(소개글·성향·이상형): 친구의 친구(매칭 후보)에겐 공개, **내 지인(1촌)에겐 기본 비공개** + 마이페이지 "지인에게 상세 프로필 공개" 토글로 개방.
- 백엔드: `ProfileSettings.detailsVisibleToFriends`(기본 false) + 엔티티 nullable 컬럼 + 매퍼 + `UpdateSettingsRequest` 부분 병합(미제공 필드 보존). 설정 PATCH가 hiddenAt을 덮어쓰던 버그도 병합으로 해소.
- 프론트: ProfileDetail에서 `degree === 1 && !detailsVisibleToFriends` → 자기소개·성향테스트·이상형 탭 숨기고 "핵심 정보만 공개된 프로필" 안내. CategoryCard(핵심)는 유지.

## 현황/한계

- **현재 1촌이 상대 상세 프로필을 여는 화면은 사실상 없음**(피드=2촌, 주선자는 지인 카드만). 본 기능은 설정 캡처 + 미래 대비(1촌 상세 진입이 생기면 즉시 적용).
- 게이팅은 **프론트 렌더 게이트**(degree 기반). 완전한 프라이버시(서버가 촌수 계산해 필드 stripping)는 후속 — 데이터는 아직 payload에 포함됨.

## 결과
- compileKotlin / vite build / vitest(40) 통과.
- 엔티티 컬럼은 nullable(`Boolean?`)로 두어 기존 H2 데이터에 ddl-auto=update가 NOT NULL ALTER로 깨지지 않게 함.
