# 0015 — 도메인 용어집 도입 + "주선 신청" → "지인 등록 요청"

- **상태**: Accepted
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

두 가지 핵심 행위가 UI 에서 모두 "신청 / 요청" 어휘로 표기되어 혼동:

| 백엔드 entity | 도메인 의미 | 기존 UI 어휘 |
|---------------|-------------|---------------|
| `MatchmakingRequest` | 요청자 → 주선자 → 대상자 매칭 요청 (3자 흐름) | **주선 요청** |
| `MatchmakerApplication` | X → Y 의 지인 네트워크 합류 (2자 흐름) | **주선 신청** |

"요청" vs "신청" 으로만 구분하기에는 의미가 충돌하고 신규 사용자가 두 흐름을 분간하기 어려움. ConnectorDashboard 안에 "주선 요청 N건", "주선 신청 N건" 이 동시에 보여 시각적으로 어느 것이 어떤 흐름인지 알 수 없음.

또한 ConnectorDashboard 의 이력 탭 최하단에 인라인 "리워드 안내" 카드가 노출되는데, 이미 `MatchmakerRewardScreen` 이라는 전용 페이지가 있어 정보 중복 + 인지 부하.

## 결정

### 1. 도메인 용어집 (`docs/GLOSSARY.md`) 도입
- 모든 도메인 용어의 single-source-of-truth
- 화면 ↔ 도메인 매핑 표
- 금지 단어 + 대체 어휘
- 새 용어 도입 시 GLOSSARY 갱신 + ADR 추가

### 2. "주선 신청" → "지인 등록 요청" 일괄 변경
- **UI 텍스트만** 변경 (entity 명 `MatchmakerApplication`, API path `/applications` 유지 — Breaking change 없음)
- 변경 위치:
  - `ConnectorDashboard.tsx` — 바텀시트 제목, 배너, empty state, 카드 섹션 코멘트, toast 메시지
- 유지:
  - 백엔드 `MatchmakerApplication` entity / repository / controller / DTO field 이름
  - API endpoint `/api/v1/matchmakers/me/applications`
  - 클라이언트 type alias `ClientApplication` (구현 디테일)
- 사유: API 명세를 변경하면 모바일 클라이언트(향후), 시드 데이터, 마이그레이션 모두 영향. UI 표면만 정정해도 사용자 혼동 해결됨.

### 3. 주선자 리워드 안내 → `MatchmakerRewardScreen` 통합
- `ConnectorDashboard` 이력 탭의 인라인 리워드 카드 제거
- `MatchmakerRewardScreen` 등급 탭 최하단에 "리워드 안내" 섹션 추가 (Sparkles 아이콘 + 3가지 카드: 감사 포인트 / 성사 커미션 / 현금 출금)
- ConnectorDashboard 에는 진입점 버튼만 유지 (`Award + ChevronRight + onNavigateToReward`)
- 같은 김에 `MatchmakerRewardScreen` 헤더도 ADR 0014 통일 패턴으로 정리

## 영향

- 신규 주선자 가입자가 두 흐름 (주선 요청 vs 지인 등록 요청) 의 차이를 텍스트로 명확히 인지
- 리워드 정보가 한 곳 (`MatchmakerRewardScreen`) 에서만 관리됨 → 정보 갱신 시 단일 수정점
- ConnectorDashboard 이력 탭 간결화 — 본질(매칭 이력 + 연결 제안 이력) 에 집중
- GLOSSARY 가 향후 PR 리뷰 시 용어 일관성 게이트 역할

## Follow-up

- IntroductionHistoryScreen, ProfileDetailScreen 의 "주선 요청" 어휘는 도메인 정의와 일치 — 변경 불필요
- 백엔드 entity 이름 (`MatchmakerApplication`) 도 통일하려면 별도 마이그레이션 PR — 우선순위 낮음 (코드 가독성 vs 변경 비용)
- 향후 X → Y 지인 등록 요청을 보내는 사용자 UI (신청자 입장) 가 구현되면, 그 화면도 "지인 등록 요청 보내기" 어휘로 작성
- GLOSSARY 에 추후 추가 후보: "팔레트 매칭 카드", "블라인드 수락", "쿨타임" 등
