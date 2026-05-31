# 0005 — 소개받기 / 주선받기 토글의 백엔드 미적용 (알려진 문제)

- **상태**: Accepted (현재 미적용 사실 기록), P1 fix 필요
- **결정일**: 2026-05-30
- **결정자**: ys.choi

## 컨텍스트

`MyProfileScreen.tsx` 설정 섹션에 두 토글이 있음:
- **소개받기** (`isAcceptingMatches` + `hiddenAt`) — 내 프로필이 지인의 피드에 노출
- **주선받기** (`isAcceptingMatches` 단독) — 지인이 보내는 주선 요청 수락

검증 결과 **두 토글 모두 백엔드 어디서도 필터링에 사용되지 않음** — UI 토글은 동작하지만 DB 에 저장만 됨, 실제 노출/요청 차단 효과 없음.

### grep 검증 (2026-05-30)
- `FeedController.getHomeFeed` — `hiddenAt` / `isAcceptingMatches` 미체크
- `FriendshipRepositoryImpl.findSecondDegreeFriendIds` — 중간 주선자의 `isAcceptingMatches` 미체크
- `MatchmakingController.request` — 대상자의 `isAcceptingMatches` 미체크
- 어디서도 두 필드를 필터에 사용 안 함

### 사용자 의도된 동작
- 소개받기 off → 내가 누구의 피드에도 보이지 않음
- 주선받기 off → 내가 주선자로 경유되지 않음 (내 1촌 A 의 피드에 내 1촌 B 가 안 보임)
- 둘 다 off → 매칭 요청 생성 자체 차단

## 결정

**이 ADR 은 사실 기록 + fix 방향 정리**. 실제 구현은 별도 PR (BACKLOG P1).

### Fix 방향
1. **`MatchabilityFilter`** 도메인 서비스 도입
   - `isVisibleInFeed(user)` — `hiddenAt == null && isAcceptingMatches`
   - `canMatchmakeAs(matchmaker)` — `isAcceptingMatches`
2. **`FeedController`** — 결과 매핑 시 `isVisibleInFeed` 체크
3. **`findSecondDegreeFriendIds`** 또는 그 위 layer — 중간 주선자 `canMatchmakeAs` 체크
4. **`MatchmakingController.request`** — 대상자 `isVisibleInFeed` + 주선자 `canMatchmakeAs` 검증

### 룰 (이후)
- 새 추천/매칭 API 는 `MatchabilityFilter` 통과 후 노출 — reviewer 가 체크
- 토글 의미 변경 시 이 ADR 갱신

## 영향

- **현재 prod 위험도**: 낮음 (베타 + 토글 사용자 적음) — 다만 프라이버시 신뢰 누락
- fix 후 영향: 비활성 사용자 노출 차단, 의도된 매칭 흐름 보장

## 임시 안내 (현재)

`MyProfileScreen.tsx` 의 토글 안내 텍스트는 의도된 동작 기준으로 유지 ("지인의 피드에 내 프로필이 노출돼요" 등) — fix 후 실제 동작과 일치.
