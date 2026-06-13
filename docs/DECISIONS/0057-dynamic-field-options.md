# 0057 — 온보딩 칩 옵션 동적 관리 (취향/서술형 enum)

- **상태**: Accepted (1차: 백엔드 카탈로그 + 어드민)
- **결정일**: 2026-06-14
- **결정자**: ys.choi
- **선행**: ADR 0055(인터뷰 질문 동적화 패턴), 0056

## 컨텍스트

회원가입 프로필 칩(체형·관심사·성격·데이트스타일·중요가치·종교·외모상·딜브레이커·흡연/음주)이 **프론트 하드코딩 + 백엔드 JVM enum**이라, 바꾸려면 매번 배포. 어드민이 칩을 추가/삭제/수정·순서변경하고 싶고, enum 을 추가/삭제해도 **하위호환**이 필요.

**사용자 결정**: 동적화 대상은 취향/서술형 enum만(구조적 항목 MBTI·성별·학력·색깔결과·직업·지역은 고정). 사주/AI 분석은 ADR 0056(완료).

## 결정 — 단일 옵션 카탈로그 + soft-delete 하위호환

인터뷰 질문 패턴(ADR 0055)을 일반화한 **단일 `field_options` 테이블**(set_key·code·label·display_order·gender·active)로 모든 칩 세트를 관리.

- **하위호환 키**: 프로필은 이미 **code 문자열**로 저장(varchar / 콤마 TEXT). 옵션 추가 → 즉시 사용, **삭제 = soft-delete(active=false)** → 과거 프로필의 code 라벨 해석이 끊기지 않음. 미등록 code 는 원문 fallback.
- **시드**: `FieldOptionSeeder`(테이블 비면 1회) — 현행 enum 값 + 한글 라벨로 시드해 현행 동작 보존. 외모상은 gender(MALE/FEMALE)로 구분.

## 범위

### 1차 (이 PR) — 백엔드 카탈로그 + 어드민
- ✅ `FieldOptionEntity`/Repository/Seeder, `field_options` 마이그레이션(drift 통과)
- ✅ 사용자 `GET /api/v1/onboarding/options` (활성 옵션 set 별 그룹 + gender)
- ✅ 어드민 `AdminFieldOptionsController` CRUD + `AdminFieldOptionsScreen`(set 탭·추가/수정/순서/활성토글/삭제) + AdminApp 라우트 + 대시보드 nav

### 2차 (PR 2b, 후속) — 온보딩 연결 + enum→String
- 프론트 `BasicInfoScreen`/`AboutMeScreen`/`IdealTypeScreen` 이 하드코딩 칩 대신 옵션 API 로 렌더, `App.tsx` 의 한글↔enum 맵 제거(code 직송).
- 백엔드 도메인 enum→String 전환(BodyType/Religion/Frequency 단일 + DatePreference/ImportantValue/DealBreaker 리스트) — DB 포맷 동일, 파급 범위는 `ProfileMapper`/`ProfileDtos`/`DataInitializer` 로 confined(스코어링 영향 없음 확인). interests/personalities/appearanceStyles 는 이미 String.
- 이 전환이 완료되어야 **어드민이 추가한 신규 code 가 온보딩→저장까지 end-to-end** 동작.

## 검증 (1차)
- `./gradlew test`(drift 포함) BUILD SUCCESSFUL · `npm run build` + vitest 39 passed.
- 로컬: 어드민 칩 옵션 화면에서 set 별 옵션 조회/추가/비활성 확인.

## 결과
- 운영자가 칩 옵션 카탈로그를 즉시 관리할 수 있는 토대 + 조회 API 완성. 온보딩 화면 연결·enum→String 하위호환은 PR 2b 로 이어 완성.
