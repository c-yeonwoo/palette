package kr.ai.palette.presentation.admin

import kr.ai.palette.infrastructure.exception.BusinessRuleViolationException
import kr.ai.palette.persistence.interview.InterviewQuestionEntity
import kr.ai.palette.persistence.interview.InterviewQuestionJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

/**
 * AI 인터뷰 질문 관리 (ADR 0055) — 운영자가 질문 선별/추가/수정/순서변경.
 * 관리자 전용 경로 — SecurityConfig 에서 ADMIN 권한으로 보호됨.
 */
@RestController
@RequestMapping("/api/v1/admin/interview-questions")
class AdminInterviewQuestionsController(
    private val repository: InterviewQuestionJpaRepository,
) {

    @GetMapping
    fun list(): ResponseEntity<List<AdminInterviewQuestion>> =
        ResponseEntity.ok(repository.findAllByOrderByDisplayOrderAsc().map { it.toDto() })

    @PostMapping
    @Transactional
    fun create(@RequestBody req: UpsertInterviewQuestionRequest): ResponseEntity<AdminInterviewQuestion> {
        validate(req)
        val key = req.questionKey.trim()
        if (repository.existsByQuestionKey(key)) {
            throw BusinessRuleViolationException("이미 존재하는 질문 키입니다: $key")
        }
        val saved = repository.save(
            InterviewQuestionEntity(
                questionKey = key,
                displayOrder = req.displayOrder,
                category = req.category.trim(),
                question = req.question.trim(),
                hint = req.hint?.trim()?.takeIf { it.isNotEmpty() },
                inputType = req.inputType,
                chips = chipsToStore(req.inputType, req.chips),
                active = req.active ?: true,
            )
        )
        return ResponseEntity.ok(saved.toDto())
    }

    @PutMapping("/{id}")
    @Transactional
    fun update(@PathVariable id: UUID, @RequestBody req: UpsertInterviewQuestionRequest): ResponseEntity<AdminInterviewQuestion> {
        validate(req)
        val entity = repository.findById(id).orElseThrow { BusinessRuleViolationException("질문을 찾을 수 없습니다") }
        // questionKey 는 answers 맵 키라 변경 시 중복만 차단
        val newKey = req.questionKey.trim()
        if (newKey != entity.questionKey && repository.existsByQuestionKey(newKey)) {
            throw BusinessRuleViolationException("이미 존재하는 질문 키입니다: $newKey")
        }
        entity.questionKey = newKey
        entity.displayOrder = req.displayOrder
        entity.category = req.category.trim()
        entity.question = req.question.trim()
        entity.hint = req.hint?.trim()?.takeIf { it.isNotEmpty() }
        entity.inputType = req.inputType
        entity.chips = chipsToStore(req.inputType, req.chips)
        req.active?.let { entity.active = it }
        entity.updatedAt = Instant.now()
        return ResponseEntity.ok(repository.save(entity).toDto())
    }

    @PatchMapping("/{id}/active")
    @Transactional
    fun toggleActive(@PathVariable id: UUID, @RequestBody req: ToggleActiveRequest): ResponseEntity<AdminInterviewQuestion> {
        val entity = repository.findById(id).orElseThrow { BusinessRuleViolationException("질문을 찾을 수 없습니다") }
        entity.active = req.active
        entity.updatedAt = Instant.now()
        return ResponseEntity.ok(repository.save(entity).toDto())
    }

    @DeleteMapping("/{id}")
    @Transactional
    fun delete(@PathVariable id: UUID): ResponseEntity<Unit> {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build()
        repository.deleteById(id)
        return ResponseEntity.noContent().build()
    }

    private fun validate(req: UpsertInterviewQuestionRequest) {
        if (req.questionKey.isBlank()) throw BusinessRuleViolationException("질문 키는 필수입니다")
        if (req.question.isBlank()) throw BusinessRuleViolationException("질문 내용은 필수입니다")
        if (req.inputType != "chips" && req.inputType != "text") {
            throw BusinessRuleViolationException("inputType 은 chips 또는 text 여야 합니다")
        }
        if (req.inputType == "chips" && req.chips.orEmpty().none { it.isNotBlank() }) {
            throw BusinessRuleViolationException("chips 타입은 선택지가 1개 이상 필요합니다")
        }
    }

    private fun chipsToStore(inputType: String, chips: List<String>?): String? =
        if (inputType == "chips") chips?.map { it.trim() }?.filter { it.isNotEmpty() }?.joinToString("\n")?.takeIf { it.isNotEmpty() }
        else null
}

private fun InterviewQuestionEntity.toDto() = AdminInterviewQuestion(
    id = id.toString(),
    questionKey = questionKey,
    displayOrder = displayOrder,
    category = category,
    question = question,
    hint = hint,
    inputType = inputType,
    chips = chips?.split("\n")?.filter { it.isNotBlank() } ?: emptyList(),
    active = active,
)

data class AdminInterviewQuestion(
    val id: String,
    val questionKey: String,
    val displayOrder: Int,
    val category: String,
    val question: String,
    val hint: String?,
    val inputType: String,
    val chips: List<String>,
    val active: Boolean,
)

data class UpsertInterviewQuestionRequest(
    val questionKey: String,
    val displayOrder: Int,
    val category: String,
    val question: String,
    val hint: String? = null,
    val inputType: String,
    val chips: List<String>? = null,
    val active: Boolean? = null,
)

data class ToggleActiveRequest(val active: Boolean)
