# 0069 — 내 색 '심층 리포트' 잠금 해제 (물감/광고)

- **상태**: Accepted (Phase 1 — 물감 해제)
- **작성일**: 2026-06-20
- **작성자**: ys.choi
- **선행**: ADR 0042(단일 잔액·물감), 0056(다근거 색 분석), 0059(소개글 섹션)

---

## 1. 문제 / 의도
색 분석을 **리포트처럼 열어보는** 경험 + 가벼운 수익화 지점. 내 분석을 ① 광고를 보거나 ② 물감을 써서 상세까지 확인.

## 2. 결정 (Phase 1)
ColorDetailScreen 을 **무료 요약 + 잠긴 심층 리포트** 구조로:
- **무료**: 색 타입·키워드·"AI가 이 색을 고른 이유"(reasoning).
- **심층(잠금)**: 나의 성향(personalitySummary) · 이런 인연과 잘 맞아요(idealTypeInsight) · 나의 강점(strengths). 잠금 시 블러 + 오버레이.
- **해제 수단**: **물감 5개**로 1회 해제 → 영구 공개(`report_unlocked`). "광고 보고 무료" 버튼은 자리만(준비 중) — 광고 SDK 후속.

프로필(소개글)과 안 겹침: 프로필=공개용 큐레이션 이야기, 리포트=분석 속살(성향·이상형·강점·근거). 자기 분석이라 프라이버시 이슈 없음.

### 구현
- 영속: `user_ticket_balances.report_unlocked BIT` (per-user, 기존 트라이얼 플래그들과 같은 테이블 — 신규 엔티티 불필요). 마이그레이션 §25(bare ALTER, continue-on-error 멱등).
- `BillingService.unlockColorReport(userId, cost)` — `consume()` 차감 후 플래그 set, **이미 해제면 재차감 없이 통과(멱등)**. `isReportUnlocked()`.
- `ColorReportController` (`/api/v1/color-report`): `GET`(unlocked+cost), `POST /unlock`(해제, 잔액부족 시 402+메시지). 비용 SoT = `REPORT_UNLOCK_COST=5`.
- 리포트 데이터 자체는 기존 `/api/v1/profile` colorType 으로 내려감 — 잠금은 **게이팅(engagement)** 이지 보안 경계 아님(자기 데이터). 프론트 블러 게이팅으로 충분.

## 3. 트레이드오프 / 한계
- **자기 분석을 유료화**하는 거부감 → 광고 무료 경로(Phase 2)가 완충. Phase 1은 물감만이라 비용 낮게(5, 남 프로필 열람 10보다 저렴).
- **광고 미연동**: 리워드 광고는 AdMob 등 네이티브(Capacitor) 통합 필요 → 별도 작업. 지금은 "준비 중" placeholder.
- **상대 리포트 유료 열람**: 보류 — 프로필과 중복 우려 + "내 리포트 비공개 원하는 사람" 때문에, 후속에 **주인 옵트인 + 열람 유료**로 별도 설계.

## 4. 영향 범위 / 검증
- 백엔드: `UserTicketBalanceEntity`(+report_unlocked), `BillingService`(+unlock/is), `ColorReportController`(신규), 마이그레이션 §25.
- 프론트: `ColorDetailScreen`(무료 요약 + 잠긴 심층 + 물감 해제 흐름).
- 검증: 백엔드 컴파일 + 프론트 build + vitest 34 그린. (실제 분석 내용은 prod 실키 LLM 기준; 로컬은 stub.)
