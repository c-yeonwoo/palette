package kr.ai.palette.presentation.onboarding

import kr.ai.palette.persistence.onboarding.OnboardingFieldEntity
import kr.ai.palette.persistence.onboarding.OnboardingFieldJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 온보딩 필드 스키마 조회 (ADR 0058) — 어드민이 관리하는 활성 필드를 섹션별로 내려준다.
 * PR 3b 프론트 온보딩 렌더러가 하드코딩 대신 이걸로 필드 순서·라벨·힌트·위젯·필수여부를 그린다.
 */
@RestController
@RequestMapping("/api/v1/onboarding")
class OnboardingFieldsController(
    private val repository: OnboardingFieldJpaRepository,
) {
    @GetMapping("/fields")
    fun fields(): ResponseEntity<OnboardingFieldsResponse> {
        val sections = repository.findByActiveTrueOrderBySectionOrderAscFieldOrderAsc()
            .groupBy { it.section }
            .map { (key, rows) ->
                OnboardingSectionDto(
                    key = key,
                    label = SECTION_LABELS[key] ?: key,
                    order = rows.first().sectionOrder,
                    fields = rows.map { it.toDto() },
                )
            }
            .sortedBy { it.order }
        return ResponseEntity.ok(OnboardingFieldsResponse(sections = sections))
    }

    companion object {
        val SECTION_LABELS = mapOf(
            "basic" to "기본 정보",
            "about" to "자기소개",
            "ideal" to "이상형",
        )
    }
}

private fun OnboardingFieldEntity.toDto() = OnboardingFieldDto(
    fieldKey = fieldKey, label = label, hint = hint, inputType = inputType,
    optionSetKey = optionSetKey, required = required, config = config,
)

data class OnboardingFieldsResponse(val sections: List<OnboardingSectionDto>)

data class OnboardingSectionDto(
    val key: String,
    val label: String,
    val order: Int,
    val fields: List<OnboardingFieldDto>,
)

data class OnboardingFieldDto(
    val fieldKey: String,
    val label: String,
    val hint: String?,
    val inputType: String,
    val optionSetKey: String?,
    val required: Boolean,
    val config: String?,
)
