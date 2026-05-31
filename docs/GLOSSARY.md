# GLOSSARY — 팔레트 도메인 용어집

> SoT. 새 용어 도입 / 기존 용어 변경 시 이 문서를 먼저 갱신하고 ADR 추가.

---

## 핵심 액터

| 용어 | 영문 | 의미 |
|------|------|------|
| **사용자** | User | 팔레트 회원 (REGULAR / MATCHMAKER_ONLY) |
| **요청자** | Requester | 주선 요청을 보낸 사용자 |
| **대상자** | Target / Receiver | 주선 요청의 매칭 상대 |
| **주선자** | Matchmaker | 두 사람을 이어주는 사람 (자신의 지인 네트워크 활용) |
| **지인** | Friend / Client | 주선자의 네트워크에 등록된 사람 (= 주선자 입장에서 "내가 주선해줄 수 있는 사람") |

---

## 핵심 행위

| 용어 | 백엔드 entity | 의미 | 흐름 |
|------|---------------|------|------|
| **주선 요청** | `MatchmakingRequest` | 요청자 A 가 주선자 C 를 통해 대상자 B 와 매칭되기를 요청 | A → C → B (2단계 승인: 주선자 → 대상자) |
| **친구 요청 / 지인 등록 요청** | `Friendship` (status=PENDING) | X 가 Y 와 **양방향 지인 관계** 를 맺기 위해 요청 (친구 코드 또는 검색 기반) | X → Y (Y 수락 시 양쪽 모두 서로의 지인) |

> ⚠️ "주선 요청" 과 "친구 요청 / 지인 등록 요청" 은 도메인이 완전히 분리됨. 절대 혼용 금지.
>
> ⚠️ ADR 0015 초안에서 "지인 등록 요청 = `MatchmakerApplication`" 으로 정의했으나 — `MatchmakerApplication` entity 는 백엔드에 존재하지 않음. 실제 양방향 친구 관계는 `Friendship` 에서 관리됨 (ADR 0016 에서 정정).

### "주선 요청" 흐름
1. 요청자 A 가 프로필 피드에서 대상자 B 발견
2. A 와 B 의 공통 주선자 C 가 있어야 요청 가능
3. A → C 에게 "B 와 매칭해주세요" 요청 (포인트 차감)
4. C 가 승인 → B 에게 전달
5. B 가 승인 → 매칭 성사 (C 에게 커미션)

### "친구 요청 / 지인 등록 요청" 흐름
1. X 가 친구 코드 입력 또는 검색으로 Y 의 프로필 발견
2. X → Y 친구 요청 전송 (`POST /api/v1/friends/request/{targetUserId}`)
3. Y 의 알림 + `FriendConnectScreen` "받은 친구 요청" 영역에 표시
4. Y 수락 (`PUT /api/v1/friends/request/{requestId}/accept`) → 양방향 `Friendship` 성립
5. 이후 X 와 Y 는 서로의 지인 목록에 표시 — X 는 Y 를 주선자로 활용 가능, Y 도 X 를 주선자로 활용 가능 (대칭)

---

## 보조 용어

| 용어 | 영문 | 의미 |
|------|------|------|
| **연결 제안** | Nudge | 주선자가 자신의 두 지인을 매칭 시켜보자고 제안하는 행위 |
| **소개** | Introduction | 요청자 입장에서 본 "주선 요청" 결과 — "소개받기" 토글 = 다른 사람의 주선 요청 대상이 되는 것 허용 |
| **팔레트 매칭** | AI Recommendation | 시스템이 추천하는 매칭 (DailyRecommendationEntity) |
| **감사 포인트** | Thank-you Points | 주선자가 지인 등록 요청을 수락 시 받는 즉시 보상 (100~500P) |
| **성사 커미션** | Match Commission | 매칭 성사 시 주선자가 받는 비율 보상 (30~50%, 레벨별) |

---

## 금지/주의 단어

| ❌ 쓰지 말 것 | ✅ 대신 사용 | 이유 |
|---------------|---------------|------|
| 주선 신청 | 지인 등록 요청 | "요청" 과 의미 중복 → 헷갈림 (ADR 0015) |
| 신청 (단독) | 지인 등록 요청 / 출금 신청 등 구체화 | 무엇의 신청인지 불명확 |
| 프렌드 / friend (UI) | 지인 | 한글 통일 (ADR 0008) |
| Palette (UI) | 팔레트 | 한글 통일 |
| 피드 노출 | 소개받기 | UX 의미 명확화 |

---

## 화면 ↔ 도메인 매핑

| 화면 | 다루는 도메인 |
|------|---------------|
| `MainFeedScreen` | 지인 네트워크 피드 + AI 추천 (주선 요청 시작점) |
| `ProfileDetailScreen` | 주선 요청 작성 |
| `IntroductionHistoryScreen` | 요청자 관점 — 내가 보낸/받은 주선 요청 |
| `ConnectorDashboard` | 주선자 관점 — **받은 주선 요청 + 지인 목록 + 매칭 이력** (친구 요청은 다루지 않음) |
| `FriendConnectScreen` | **지인 관리** — 친구 코드 / 검색 / 친구 요청 보내기 + 받은 친구 요청 수락 / 지인 목록 |
| `MatchmakerRewardScreen` | 주선자 등급, 포인트, 출금, 리워드 안내 |
| `MyPageScreen` | 자기 프로필 / 설정 |

---

## 변경 이력

- 2026-05-31 — 초안 작성. "주선 신청" → "지인 등록 요청" UI 어휘 일괄 변경 (ADR 0015).
- 2026-05-31 — entity 매핑 정정. `MatchmakerApplication` 은 존재하지 않으며 양방향 친구 관계는 `Friendship` 에서 관리됨. ConnectorDashboard 의 application UI 제거, `FriendConnectScreen` 으로 일원화 (ADR 0016).
