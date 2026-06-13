# 0057 — 온보딩 칩 옵션 동적 관리 (취향/서술형 enum)

- **상태**: Accepted (1차 + 2차 완료 — 백엔드 카탈로그·어드민 + 온보딩 연결·enum→String)
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

### 2차 (PR 2b) — 온보딩 연결 + enum→String ✅ 완료
- ✅ 백엔드 도메인 enum→String 전환: `BasicInfo.bodyType`, `LifestyleInfo.{smoking,drinking,religion}` 단일 String + `IdealType.{datePreferences,importantValues,dealBreakers}` `List<String>`. (personalities/appearanceStyles 는 이미 String.) DB 포맷 동일(varchar/콤마 TEXT) → 기존 데이터 무영향. enum 정의는 코드 참조용으로 잔존하나 컬럼 제약 제거.
- ✅ 파급: `ProfileEntity`(body_type·smoking·drinking·religion → `varchar(40)`), `ProfileMapper`(valueOf/.name 제거, passthrough), `ProfileDtos`, `DataInitializer`·`DevDataSeeder`(시드 리터럴 `.name`), `EmbeddingRefreshService`(라벨 맵 key 를 code 로). 스코어링/매칭 영향 없음 재확인. 마이그레이션 `ALTER profiles MODIFY ... VARCHAR(40)`.
- ✅ 프론트: `useOnboardingOptions` 훅(`GET /api/v1/onboarding/options`, 실패 시 시드 동일 폴백 + 비어있지 않은 세트만 덮어씀). `BasicInfoScreen`(체형)·`AboutMeScreen`(흡연/음주/종교/관심사)·`IdealTypeScreen`(데이트선호/중요가치/성격/외모상/딜브레이커)이 옵션 API 로 렌더하고 **code 를 저장**. `App.tsx` 의 6개 한글↔enum 맵(body/frequency/religion/datePreference/importantValue/appearanceStyle) 제거 → code 직송. jobCategory·education 맵은 고정 enum 이라 유지.
- 결과: **어드민이 추가/비활성한 신규 code 가 온보딩→저장까지 end-to-end** 동작.

## 검증
- 1차: `./gradlew test`(drift 포함) · `npm run build` + vitest 39 passed · 어드민 옵션 화면 set 별 조회/추가/비활성.
- 2차: enum→String 후 `SPRING_PROFILES_ACTIVE=test ./gradlew test` BUILD SUCCESSFUL(도메인 테스트 code 문자열로 갱신) · `npm run build` + vitest **39 passed**.

## 결과
- 운영자가 취향/서술형 칩 옵션을 코드 수정·배포 없이 즉시 관리(추가·수정·순서·비활성)할 수 있고, 신규 코드가 온보딩 입력→영속화까지 동작. enum 삭제는 soft-delete 로 과거 프로필 하위호환 보존. 질문·순서·필드 자체의 동적화(schema-driven)는 PR 3(ADR 0058)로 후속.
