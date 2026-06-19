# 0065 — 매칭 성사 핸드오프: 정직한 연락처 공유

- **상태**: Accepted
- **작성일**: 2026-06-20
- **작성자**: ys.choi
- **선행**: ADR 0050(만남 후 후기), 0051(만남 피드백·관계 종결), [POLICY §6 외부 송금 금지](../POLICY.md), ADR 0064(무현금 주선 모델)

---

## 1. 문제

매칭 성사(`MatchmakingRequest.status = COMPLETED`) 후 두 당사자가 **실제로 어떻게 연락을 시작하는가**가 비어 있었다.

- 백엔드 `MatchmakingService.acceptByTarget()` 는 성사 시 양쪽 모두 전화번호가 있는지 `validateContactInfo()` 로 **검증까지** 한다 — "연락처 교환을 위해". 그러나 그 연락처를 **어디에서도 반환하지 않았다**.
- 프론트 "인연" 화면(`IntroductionHistoryScreen`)은 성사 카드에 "매칭 성사! 🎉 / 연락처를 확인해보세요" 라고 **약속만** 하고, 정작 상대 연락처는 표시하지 않았다.
- 별도로 존재하던 mock 채팅 동선(`MatchSuccessModal` 의 "메시지 시작하기 (매칭권 1개)" CTA, `MatchDetailScreen` 의 `ChatThread` 탭)은 실제 백엔드가 없어 어디로도 이어지지 않았다. `MatchSuccessModal` 은 어디서도 렌더되지 않는 死 코드였고, `MatchDetailScreen` 은 항상 "준비 중" 빈 상태만 노출(사용자에게 mock 누출은 없었음).

결과: 서비스의 **핵심 가치 순간**(성사 → 실제 만남)이 정직하지 못한 빈 약속이었다.

## 2. 결정

성사 후 핸드오프를 **정직한 연락처 공유**로 통일한다. 자체 채팅(IM)은 MVP 범위에서 제외하고, 외부 채널(카카오톡/문자/전화)로 연결한다.

### 백엔드 — `RelationshipController`
- `RelationshipStatusResponse` 에 `partnerName` · `partnerPhone` · `partnerKakaoId` 추가.
- `resolvePartnerContact(request, myId)`: 요청자↔수신자 중 내가 아닌 쪽 `User` 를 조회해 `publicInfo.nickname`(없으면 `realName`) · `getEffectivePhoneNumber()` · `getKakaoTalkId()` 를 채운다.
- `GET /relationships`(목록)는 이미 "내 요청"만 반환 → 당사자 한정.
- `GET /relationships/{id}`(단건)에는 **당사자 가드(403)를 신규 추가** — 연락처가 응답에 포함되므로, requestId 만 알면 아무 인증 사용자나 조회하던 기존 누출 경로를 차단.

### 프론트 — `IntroductionHistoryScreen`
- `MATCHED` / `CONTACTS_EXCHANGED` 단계에서 **연락처 공유 카드** 노출: 카카오톡 ID(있으면) + 전화번호, 각각 복사 버튼, 전화번호엔 `sms:` 문자 링크.
- "첫 메시지 추천" 모달(S-002)의 상대 이름을 하드코딩 "상대방" → 실제 `partnerName` 으로 연동.

### 정리(死 코드)
- `MatchSuccessModal.tsx` 삭제(참조 0건, "매칭권 1개" 채팅 CTA).
- `MatchDetailScreen` + `chat/*`(ChatThread mock) 은 **유지** — 항상 빈 상태라 사용자 누출 없음. 자체 채팅 도입(ADR 후속)에서 재활용/정리 대상.

## 3. 근거

- **이미 설계된 계약의 완성**: 성사 시 전화번호 검증은 "연락처 교환" 목적으로 존재했다. 본 변경은 새 데이터 노출이 아니라, **검증해 둔 연락처를 의도대로 당사자에게 전달**하는 것이다.
- **프라이버시 범위**: 연락처는 `COMPLETED` 관계의 두 당사자에게만, 본인이 직접 호출한 경로에서만 노출(목록=내 요청 한정, 단건=403 가드). 주선자/제3자에겐 노출 안 함.
- **무현금 모델(ADR 0064)과 정합**: 핸드오프 카드에 기존 "주선은 무료" InfoHint 가 함께 떠, 외부 송금 유도 사기를 경계.
- **카카오톡 우선**: 한국 사용자 관습상 전화번호 직접 노출보다 카카오톡 ID 교환이 자연스럽고 안전. ID 가 있으면 우선 노출, 없으면 전화번호로 폴백.

## 4. 트레이드오프 / 한계

- **자체 채팅 부재**: 신고·차단·증거 보존이 외부 채널로 빠지면 약해진다. → 후속 ADR(채팅 fast-follow)에서 인앱 경량 채팅을 안전 레이어로 검토.
- **카카오톡 딥링크 한계**: KakaoTalk 은 "ID로 채팅 열기" 안정적 딥링크가 없어, ID 는 **복사 후 직접 검색** 방식으로 안내. 전화번호만 `sms:` 링크 제공.
- **연락처 정확성**: 가입 시 인증된 전화번호 기반. 카카오톡 ID 는 선택(미입력 시 카드에서 생략).

## 5. 영향 범위

- 신규 컬럼/엔티티 없음 → DB 마이그레이션·`SchemaDriftTest` 무관. `ContactInfo` 는 이미 영속화돼 있음.
- 백엔드: `RelationshipController` (DTO 3필드, `UserRepository` 주입, 단건 403 가드).
- 프론트: `IntroductionHistoryScreen` (연락처 카드, 첫 메시지 이름 연동), `MatchSuccessModal.tsx` 삭제.
