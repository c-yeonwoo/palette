# 0021 — 주선자 등급 네이밍 변경(메탈 티어) + 단일 소스화

- **상태**: Accepted
- **결정일**: 2026-06-06
- **결정자**: ys.choi

## 컨텍스트

주선자 레벨(1~5) 이름이 식물 메타포(씨앗/새싹/꽃/나무/열매/숲)로 진부했고, 더 큰 문제는 **5개 화면에 정의가 제각각 흩어져 이름·순서가 서로 어긋나 있었다**:

| 위치 | 기존 Lv.1~5 |
|---|---|
| ConnectorDashboard | 새싹 / 씨앗 / 꽃봉오리 / 꽃 / 나무 |
| MatchmakerRewardScreen | 씨앗 / 새싹 / 나무 / 열매 / 숲 |
| MatchmakerPublicProfileScreen | 씨앗 / 새싹 / 꽃 / 나무 / 숲 |
| mock-marketplace | 씨앗 / 새싹 / 꽃 / 나무 / 숲 |
| DesignSystemScreen | 씨앗 / 새싹 / 꽃 / 나무 / 숲 |

같은 레벨이 화면마다 다른 이름으로 보였다(예: Lv.2 가 대시보드에선 "씨앗", 리워드에선 "새싹"). 백엔드는 레벨 번호 + 커미션율만 반환하고 이름은 프론트가 각자 매핑.

## 결정

1. **메탈 티어로 통일**: 브론즈 → 실버 → 골드 → 플래티넘 → 다이아몬드 (Lv.1~5).
   구간(0-2/3-5/6-10/11-20/21+) · 커미션(30/35/40/45/50%)은 정책 그대로(POLICY §1.2).
2. **단일 소스 신설**: `frontend/src/lib/matchmakerLevels.ts`
   - `MATCHMAKER_TIERS` / `MATCHMAKER_TIER_LIST` (level·name·emoji·commission·minMatches·maxMatches·color)
   - `tierFor(level)` / `nextTier(level)` 헬퍼
   - 5개 화면은 전부 이 파일만 참조. 로컬 `LEVEL_META`/`LEVEL_INFO` 정의 제거.

`ProfileEditScreen` 의 씨앗/새싹/꽃/나무는 **프로필 완성도 레벨**(별개 개념)이라 범위에서 제외.

## 결과

- 모든 화면이 동일한 등급명·순서를 보장(단일 소스).
- 향후 등급 정책 변경은 `matchmakerLevels.ts` 한 곳만 수정.
- tsc / build / vitest(40) 통과.

## 알려진 충돌(후속 검토 대상)

같은 "브론즈/실버/골드" 명칭이 다른 시스템에서도 쓰인다:
- **리그/랭킹**(`LeagueScreen`): 브론즈/실버/골드 **큐피드** (suffix 로 구분됨)
- **프로필 신뢰도 티어**(`PhotoUploadScreen` 등): Bronze/Silver/Gold (영문·다른 맥락)

세 시스템이 다른 화면·맥락이라 당장 혼동은 적지만, 추후 사용자 혼선이 보이면 주선자 등급을 차별화(예: "다이아 주선자")하거나 리그 명칭을 손볼 수 있음.
