package kr.ai.palette.presentation.admin

import kr.ai.palette.infrastructure.exception.BusinessRuleViolationException
import kr.ai.palette.persistence.option.FieldOptionEntity
import kr.ai.palette.persistence.option.FieldOptionJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

/**
 * 온보딩 칩 옵션 관리 (ADR 0057) — 운영자가 set 별 옵션 추가/수정/순서/활성/삭제.
 * 관리자 전용 경로 — SecurityConfig 에서 ADMIN 권한으로 보호됨.
 */
@RestController
@RequestMapping("/api/v1/admin/field-options")
class AdminFieldOptionsController(
    private val repository: FieldOptionJpaRepository,
) {
    @GetMapping
    fun list(@RequestParam(required = false) setKey: String?): ResponseEntity<List<AdminFieldOption>> {
        val rows = if (setKey.isNullOrBlank()) repository.findAllByOrderBySetKeyAscDisplayOrderAsc()
        else repository.findBySetKeyOrderByDisplayOrderAsc(setKey)
        return ResponseEntity.ok(rows.map { it.toDto() })
    }

    @PostMapping
    @Transactional
    fun create(@RequestBody req: UpsertFieldOptionRequest): ResponseEntity<AdminFieldOption> {
        validate(req)
        val gender = req.gender?.trim()?.uppercase()?.takeIf { it.isNotEmpty() }
        if (repository.existsBySetKeyAndCodeAndGender(req.setKey.trim(), req.code.trim(), gender)) {
            throw BusinessRuleViolationException("이미 존재하는 옵션입니다 (${req.setKey}/${req.code})")
        }
        val saved = repository.save(
            FieldOptionEntity(
                setKey = req.setKey.trim(),
                code = req.code.trim(),
                label = req.label.trim(),
                displayOrder = req.displayOrder,
                gender = gender,
                active = req.active ?: true,
            ),
        )
        return ResponseEntity.ok(saved.toDto())
    }

    @PutMapping("/{id}")
    @Transactional
    fun update(@PathVariable id: UUID, @RequestBody req: UpsertFieldOptionRequest): ResponseEntity<AdminFieldOption> {
        validate(req)
        val e = repository.findById(id).orElseThrow { BusinessRuleViolationException("옵션을 찾을 수 없습니다") }
        // code/setKey 변경 시 중복만 차단 (code 는 저장값이라 변경 신중)
        val gender = req.gender?.trim()?.uppercase()?.takeIf { it.isNotEmpty() }
        if ((req.setKey.trim() != e.setKey || req.code.trim() != e.code || gender != e.gender) &&
            repository.existsBySetKeyAndCodeAndGender(req.setKey.trim(), req.code.trim(), gender)
        ) {
            throw BusinessRuleViolationException("이미 존재하는 옵션입니다")
        }
        e.setKey = req.setKey.trim()
        e.code = req.code.trim()
        e.label = req.label.trim()
        e.displayOrder = req.displayOrder
        e.gender = gender
        req.active?.let { e.active = it }
        e.updatedAt = Instant.now()
        return ResponseEntity.ok(repository.save(e).toDto())
    }

    @PatchMapping("/{id}/active")
    @Transactional
    fun toggleActive(@PathVariable id: UUID, @RequestBody req: ToggleActiveRequest): ResponseEntity<AdminFieldOption> {
        val e = repository.findById(id).orElseThrow { BusinessRuleViolationException("옵션을 찾을 수 없습니다") }
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

    private fun validate(req: UpsertFieldOptionRequest) {
        if (req.setKey.isBlank()) throw BusinessRuleViolationException("set 키는 필수입니다")
        if (req.code.isBlank()) throw BusinessRuleViolationException("코드(저장값)는 필수입니다")
        if (req.label.isBlank()) throw BusinessRuleViolationException("라벨은 필수입니다")
    }
}

private fun FieldOptionEntity.toDto() = AdminFieldOption(
    id = id.toString(), setKey = setKey, code = code, label = label,
    displayOrder = displayOrder, gender = gender, active = active,
)

data class AdminFieldOption(
    val id: String,
    val setKey: String,
    val code: String,
    val label: String,
    val displayOrder: Int,
    val gender: String?,
    val active: Boolean,
)

data class UpsertFieldOptionRequest(
    val setKey: String,
    val code: String,
    val label: String,
    val displayOrder: Int = 0,
    val gender: String? = null,
    val active: Boolean? = null,
)
