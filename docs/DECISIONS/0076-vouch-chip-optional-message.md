# ADR 0076 — 친구 보증 L0/L1/L2 (칩 기본 · 한마디 옵셔널)

- 상태: 채택
- 날짜: 2026-07-14
- 관련: [[0075]] (프로필 서사 · vouch 노출)

## 배경

보증 문장 쓰기는 지인 앞에서 부담이 커서 참여율이 떨어질 수 있다.
"어떤 말을 쓸지" + "상대가 봄" 부담을 줄여야 한다.

## 결정

보증은 **옵셔널 레이어**:

| 레벨 | UX | 저장 |
|------|-----|------|
| L0 | 칩·문장 없이 원탭 | preset_key=null, message=null |
| L1 | 프리셋 칩 선택 | preset_key |
| L2 | 최대 50자 한마디 (선택) | message |

- 기본 CTA는 VouchSheet — 칩/한마디 모두 비워도 제출 가능
- 프로필 표시: message > presetLabel > "이 분을 보증해요"
- vouch 0이어도 프로필이 초라해 보이지 않게 (기존 서사 유지)
- 권한: 기존과 동일 (1촌 OR 매칭 COMPLETED)

## 스키마

`vouches.preset_key VARCHAR(32)`, `vouches.message VARCHAR(50)`
