# 0026 — 개인 프로필: 등급/신뢰도 제거, "색깔"만 유효 + 나의 색 위치 이동

- **상태**: Accepted
- **결정일**: 2026-06-07
- **결정자**: ys.choi

## 컨텍스트

마이페이지/프로필에 성격이 다른 "등급"들이 섞여 혼란을 줬다:

- **프로필 활동 레벨**(씨앗/새싹/꽃/나무, `ProfileEditScreen`의 `ProfileLevelBanner`) — 사진 추가 시 "Lv.2 새싹"이 떠서 주선자 등급과 혼동.
- **신뢰도 점수**(trustScore, Bronze/Silver/Gold) — `PhotoUploadScreen`·`MyProfileScreen`에 표시.

게다가 "나의 색" 설명이 마이페이지에 있어, 정체성(색)이 프로필이 아닌 설정 화면에 묻혀 있었다.

### 핵심 발견 — 신뢰도는 죽은 지표

`Profile.recalculateMetrics()`는 **completionRate만 계산**한다. `trustScore`는 도메인 어디에서도 산출/갱신되지 않아 실제 사용자는 항상 0 (시드 유저만 하드코딩 값 보유). 문서(POLICY)의 신뢰도 가산 스킴(사진 +10, 영상 +50…)은 **서버에 구현된 적이 없고**, `PhotoUploadScreen`이 클라이언트 전용 미리보기 숫자만 보여줬다. → 정책 부재.

## 결정

원칙: **개인 프로필에는 등급/레벨/점수가 없다. 정체성은 "색깔"뿐.** (등급은 주선자에게만 — ADR 0021)

1. **프로필 활동 레벨 제거** — `ProfileEditScreen`의 `LEVEL_META`/`computeLevel`/`ProfileLevelBanner` 전부 삭제. 색은 레벨로 잠그지 않음(`colorLocked` 로직 제거).
2. **신뢰도 UI 제거** — `MyProfileScreen` 신뢰도 stat 제거(열람 수만 유지), `PhotoUploadScreen`의 점수·Bronze/Silver/Gold·"+점수" 문구를 "좋은 사진 가이드"(점수 없음)로 교체. 영상 섹션의 "+50 신뢰도" 제거. **백엔드 `trustScore` 필드/DTO는 보존**(향후 재활용 여지).
3. **나의 색 → 내 프로필로 이동** — 마이페이지의 "나의 색" 카드/CTA 제거. `MyProfileScreen`의 색 섹션을 탭하면 `ColorDetailScreen`(AI 근거·성향·이상형)으로. `ColorDetail` 뒤로가기 → myProfile.
4. **마이페이지 중복 메뉴 제거** — "내 활동"의 "주선자 대시보드" 항목 제거(하단 "주선" 탭과 중복). `onNavigateToConnector`/`onNavigateToColor` props 정리.
5. **프로필 수정 이모지 제거** — `ProfileEditScreen` 칩 라벨의 이모지 prefix(`{x.emoji}`) 및 라벨 문자열에 박힌 이모지(라이프스타일/학력/데이트스타일/소득버튼/커스텀항목) 제거 → 진지·프리미엄 톤. (데이터 객체의 `emoji:` 필드는 미렌더라 보존)
6. **완성도(completionRate) 용도 한정** — "완성도가 높을수록 더 정밀하게 추천돼요" 안내 용도로만. **하드 게이트 없음**(100% 미달이어도 추천 노출). 체크리스트의 "신뢰도" 문구는 "매칭 확률/추천 정확도"로 교체.

## 결과

- 개인 프로필 = 색깔 중심. 등급/점수 노출 0.
- vite build / vitest(40) 통과.

## 후속 (별도 검토)

- **신뢰도 → "매너 온도"(가칭)**: 만남 이후 양측 상호평가(매너/약속이행)를 정량화하는 방향이 유력. 단 보복성 평가 방지·편향 보정·표본 부족 구간 처리 등 어뷰징 설계(T&S)가 선행돼야 함 → 별도 기획.
- 백엔드 `trustScore` 필드는 위 결정 전까지 미사용 상태로 보존(제거하지 않음).
- POLICY의 신뢰도 가산 스킴 문단은 "미구현/보류"로 정정 필요.
