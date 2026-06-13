package kr.ai.palette.persistence.onboarding

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * 온보딩 프로필 필드 메타 — 어드민 동적 관리 (ADR 0058, schema-driven onboarding).
 *
 * 회원가입 프로필 화면의 "어떤 질문/필드가, 어느 섹션에, 어떤 순서·라벨·힌트·위젯으로,
 * 필수인지" 를 코드 테이블로 이관. 칩 선택지 자체는 ADR 0057 의 field_options 가 담당하고,
 * 여기서는 `option_set_key` 로 그 세트를 참조한다.
 *
 * - section: "basic"(기본정보) | "about"(자기소개·라이프스타일) | "ideal"(이상형)
 * - input_type: text | date | gender | slider | rangeSlider | mbti | interview
 *               | singleChip | multiChip | rankedChip
 * - option_set_key: field_options.set_key 참조(동적 칩). null = 위젯 자체 보유(고정 enum·자유입력)
 * - config: 위젯별 부가 설정 JSON (slider min/max/unit, maxSelect 등). 파싱 실패해도 안전하게 무시.
 *
 * 하위호환: PR 3b 프론트 렌더러는 field_key 로 위젯을 매칭한다. 비활성(active=false) 필드는
 * 온보딩에서 숨기되 기존 프로필 데이터는 보존. 알 수 없는 신규 field_key 는 위젯이 없으면 무시.
 */
@Entity
@Table(
    name = "onboarding_fields",
    indexes = [Index(name = "idx_of_order", columnList = "section_order, field_order")],
)
class OnboardingFieldEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    /** 필드 식별자 (프론트 위젯 매칭 키). 예: "name","bodyType","datePreference" */
    @Column(name = "field_key", nullable = false, length = 50)
    var fieldKey: String,

    /** 섹션 (basic | about | ideal) */
    @Column(name = "section", nullable = false, length = 30)
    var section: String,

    /** 섹션 표시 순서 */
    @Column(name = "section_order", nullable = false)
    var sectionOrder: Int,

    /** 섹션 내 필드 순서 */
    @Column(name = "field_order", nullable = false)
    var fieldOrder: Int,

    @Column(name = "label", nullable = false, length = 200)
    var label: String,

    @Column(name = "hint", length = 500)
    var hint: String? = null,

    /** 위젯 타입 */
    @Column(name = "input_type", nullable = false, length = 30)
    var inputType: String,

    /** field_options.set_key 참조 (동적 칩). null = 고정/자유입력 */
    @Column(name = "option_set_key", length = 40)
    var optionSetKey: String? = null,

    @Column(name = "required", nullable = false)
    var required: Boolean = false,

    /** 위젯별 부가 설정 JSON */
    @Column(name = "config", columnDefinition = "TEXT")
    var config: String? = null,

    @Column(name = "active", nullable = false)
    var active: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
