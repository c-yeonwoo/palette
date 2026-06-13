package kr.ai.palette.presentation.admin

import kr.ai.palette.infrastructure.exception.BusinessRuleViolationException
import kr.ai.palette.persistence.onboarding.OnboardingFieldEntity
import kr.ai.palette.persistence.onboarding.OnboardingFieldJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

/**
 * 온보딩 필드 메타 관리 (ADR 0058) — 운영자가 섹션/순서/라벨/힌트/필수/노출을 직접 관리.
 * 칩 선택지(code/label) 는 field-options 화면(ADR 0057) 에서 따로 관리.
 * 관리자 전용 경로 — SecurityConfig 에서 ADMIN 권한으로 보호됨.
 */
@RestController
@RequestMapping("/api/v1/admin/onboarding-fields")
class AdminOnboardingFieldsController(
    private val repository: OnboardingFieldJpaRepository,
) {
    @GetMapping
    fun list(): ResponseEntity<List<AdminOnboardingField>> =
        ResponseEntity.ok(repository.findAllByOrderBySectionOrderAscFieldOrderAsc().map { it.toDto() })

    @PostMapping
    @Transactional
    fun create(@RequestBody req: UpsertOnboardingFieldRequest): ResponseEntity<AdminOnboardingField> {
        validate(req)
        if (repository.existsByFieldKey(req.fieldKey.trim())) {
            throw BusinessRuleViolationException("이미 존재하는 field_key 입니다 (${req.fieldKey})")
        }
        val saved = repository.save(
            OnboardingFieldEntity(
                fieldKey = req.fieldKey.trim(),
                section = req.section.trim(),
                sectionOrder = req.sectionOrder,
                fieldOrder = req.fieldOrder,
                label = req.label.trim(),
                hint = req.hint?.trim()?.takeIf { it.isNotEmpty() },
                inputType = req.inputType.trim(),
                optionSetKey = req.optionSetKey?.trim()?.takeIf { it.isNotEmpty() },
                required = req.required ?: false,
                config = req.config?.trim()?.takeIf { it.isNotEmpty() },
                active = req.active ?: true,
            ),
        )
        return ResponseEntity.ok(saved.toDto())
    }

    @PutMapping("/{id}")
    @Transactional
    fun update(@PathVariable id: UUID, @RequestBody req: UpsertOnboardingFieldRequest): ResponseEntity<AdminOnboardingField> {
        validate(req)
        val e = repository.findById(id).orElseThrow { BusinessRuleViolationException("필드를 찾을 수 없습니다") }
        if (req.fieldKey.trim() != e.fieldKey && repository.existsByFieldKey(req.fieldKey.trim())) {
            throw BusinessRuleViolationException("이미 존재하는 field_key 입니다")
        }
        e.fieldKey = req.fieldKey.trim()
        e.section = req.section.trim()
        e.sectionOrder = req.sectionOrder
        e.fieldOrder = req.fieldOrder
        e.label = req.label.trim()
        e.hint = req.hint?.trim()?.takeIf { it.isNotEmpty() }
        e.inputType = req.inputType.trim()
        e.optionSetKey = req.optionSetKey?.trim()?.takeIf { it.isNotEmpty() }
        req.required?.let { e.required = it }
        e.config = req.config?.trim()?.takeIf { it.isNotEmpty() }
        req.active?.let { e.active = it }
        e.updatedAt = Instant.now()
        return ResponseEntity.ok(repository.save(e).toDto())
    }

    @PatchMapping("/{id}/active")
    @Transactional
    fun toggleActive(@PathVariable id: UUID, @RequestBody req: ToggleActiveRequest): ResponseEntity<AdminOnboardingField> {
        val e = repository.findById(id).orElseThrow { BusinessRuleViolationException("필드를 찾을 수 없습니다") }
        e.active = req.active
        e.updatedAt = Instant.now()
        return ResponseEntity.ok(repository.save(e).toDto())
    }

    @DeleteMapping("/{id}")
    @Transactional
    fun delete(@PathVariable id: UUID): ResponseEntity<Unit> {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build()
        repository.deleteById(id)
        return ResponseEntity.noContent().build()
    }

    private fun validate(req: UpsertOnboardingFieldRequest) {
        if (req.fieldKey.isBlank()) throw BusinessRuleViolationException("field_key 는 필수입니다")
        if (req.section.isBlank()) throw BusinessRuleViolationException("섹션은 필수입니다")
        if (req.label.isBlank()) throw BusinessRuleViolationException("라벨은 필수입니다")
        if (req.inputType.isBlank()) throw BusinessRuleViolationException("위젯 타입은 필수입니다")
    }
}

private fun OnboardingFieldEntity.toDto() = AdminOnboardingField(
    id = id.toString(), fieldKey = fieldKey, section = section,
    sectionOrder = sectionOrder, fieldOrder = fieldOrder, label = label, hint = hint,
    inputType = inputType, optionSetKey = optionSetKey, required = required, config = config, active = active,
)

data class AdminOnboardingField(
    val id: String,
    val fieldKey: String,
    val section: String,
    val sectionOrder: Int,
    val fieldOrder: Int,
    val label: String,
    val hint: String?,
    val inputType: String,
    val optionSetKey: String?,
    val required: Boolean,
    val config: String?,
    val active: Boolean,
)

data class UpsertOnboardingFieldRequest(
    val fieldKey: String,
    val section: String,
    val sectionOrder: Int = 0,
    val fieldOrder: Int = 0,
    val label: String,
    val hint: String? = null,
    val inputType: String,
    val optionSetKey: String? = null,
    val required: Boolean? = null,
    val config: String? = null,
    val active: Boolean? = null,
)
