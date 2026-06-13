# 0058 — Schema-driven 온보딩 (필드·섹션·순서 동적화)

- **상태**: Accepted (3a 완료 — 백엔드 카탈로그 + 어드민. 3b: 프론트 렌더러 후속)
- **결정일**: 2026-06-14
- **결정자**: ys.choi
- **선행**: ADR 0055(인터뷰 질문 동적화), 0057(칩 옵션 동적화)

## 컨텍스트

ADR 0057(2차)로 회원가입 프로필의 **칩 선택지(code/label)**는 어드민이 관리하게 됐지만, **어떤 필드가 / 어느 섹션에 / 어떤 순서·라벨·힌트·위젯으로 / 필수인지**는 여전히 프론트 3개 화면(`BasicInfoScreen`/`AboutMeScreen`/`IdealTypeScreen`)에 하드코딩. 질문을 추가/재배치/숨김하거나 라벨·필수여부를 바꾸려면 매번 배포가 필요.

목표: 온보딩 필드 메타(필드/섹션/순서/라벨/힌트/위젯/필수)를 코드 테이블로 이관해 어드민이 관리. 칩 옵션(0057) 위에 **필드 레이어**를 얹는다.

## 결정 — 단일 `onboarding_fields` 카탈로그

ADR 0055/0057 패턴을 일반화한 단일 테이블:

`onboarding_fields(field_key UNIQUE, section, section_order, field_order, label, hint, input_type, option_set_key, required, config(JSON), active, timestamps)`

- **field_key**: 프론트 위젯 매칭 키 (예: `bodyType`, `datePreference`). 변경 신중.
- **section**: `basic`(기본정보) | `about`(자기소개·라이프스타일) | `ideal`(이상형).
- **input_type**: `text`·`date`·`gender`·`slider`·`rangeSlider`·`mbti`·`interview`·`singleChip`·`multiChip`·`rankedChip`.
- **option_set_key**: `field_options.set_key`(0057) 참조 → 동적 칩. null = 위젯 자체 보유(고정 enum·자유입력·특수 위젯).
- **config**: 위젯별 부가 설정 JSON(slider min/max/unit, maxSelect 등). 파싱 실패해도 안전 무시.
- **하위호환**: 비활성(active=false) 필드는 온보딩에서 숨기되 기존 프로필 데이터 보존. 알 수 없는 신규 field_key 는 대응 위젯이 없으면 무시(3b 렌더러 규약).

칩 옵션(0057)과 책임 분리: **무엇을 묻는가/순서**는 `onboarding_fields`, **선택지 code/label**은 `field_options`.

## 범위

### 3a (이 PR) — 백엔드 카탈로그 + 어드민 ✅
- ✅ `OnboardingFieldEntity`/`OnboardingFieldJpaRepository`/`OnboardingFieldSeeder`(@Order 54, count>0 skip — 현행 3개 화면 21개 필드 충실 시드).
- ✅ 사용자 `GET /api/v1/onboarding/fields` (활성 필드 섹션별 그룹 + 섹션 라벨·순서).
- ✅ 어드민 `AdminOnboardingFieldsController` CRUD(`/api/v1/admin/onboarding-fields`, `ToggleActiveRequest` 재사용) + `AdminOnboardingFieldsScreen`(섹션 트리·추가/수정/순서/필수·활성토글/삭제·config JSON 검증) + AdminApp 라우트 `onboardingFields` + 대시보드 nav.
- ✅ 마이그레이션 `onboarding_fields`(`) ENGINE=InnoDB`, SchemaDriftTest 통과).

### 3b (후속) — 프론트 스키마 렌더러
- `BasicInfo`/`AboutMe`/`IdealType` 을 `GET /api/v1/onboarding/fields` 기반으로 점진 전환: 필드 순서·라벨·힌트·노출·필수여부를 API 메타로, **위젯 컴포넌트는 field_key 로 기존 것 재사용**(한 번에 위젯까지 갈아엎지 않음 — 위험 최소화). 칩 데이터는 0057 `useOnboardingOptions` 와 결합.
- 이 단계가 완료되면 어드민이 질문 추가/재배치/숨김·라벨/필수 변경을 배포 없이 반영.

## 검증 (3a)
- `SPRING_PROFILES_ACTIVE=test ./gradlew test` BUILD SUCCESSFUL (SchemaDriftTest 포함 — `onboarding_fields` 모든 컬럼 매핑 확인).
- `npm run build` 성공 · `npx vitest run` 39 passed.

## 결과
- 온보딩 필드 메타를 어드민이 즉시 관리할 토대 + 조회 API 완성. 현행 동작은 시드로 보존. 프론트 스키마 렌더러 연결은 3b 로 이어 완성한다.
