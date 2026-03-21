package kr.ai.palette.presentation.prompt

import kr.ai.palette.application.prompt.PromptExecutionService
import kr.ai.palette.application.prompt.PromptManagementService
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.prompt.PromptCategory
import kr.ai.palette.domain.prompt.PromptExecutionId
import kr.ai.palette.domain.prompt.PromptId
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * 프롬프트 관리 API 컨트롤러
 */
@RestController
@RequestMapping("/api/prompts")
class PromptController(
    private val promptManagementService: PromptManagementService,
    private val promptExecutionService: PromptExecutionService
) {
    /**
     * 프롬프트 템플릿 생성
     */
    @PostMapping
    fun createPromptTemplate(
        @RequestBody request: CreatePromptTemplateRequest
    ): ResponseEntity<PromptTemplateResponse> {
        val template = promptManagementService.createPromptTemplate(
            name = request.name,
            description = request.description,
            category = request.category,
            template = request.template,
            variables = request.variables,
            systemMessage = request.systemMessage,
            temperature = request.temperature,
            maxTokens = request.maxTokens
        )

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(PromptTemplateResponse.from(template))
    }

    /**
     * 프롬프트 템플릿 목록 조회
     */
    @GetMapping
    fun getPromptTemplates(
        @RequestParam(required = false) category: PromptCategory?,
        @RequestParam(required = false, defaultValue = "false") activeOnly: Boolean
    ): ResponseEntity<List<PromptTemplateResponse>> {
        val templates = when {
            activeOnly -> promptManagementService.getActivePromptTemplates()
            category != null -> promptManagementService.getPromptTemplatesByCategory(category)
            else -> promptManagementService.getAllPromptTemplates()
        }

        return ResponseEntity.ok(templates.map { PromptTemplateResponse.from(it) })
    }

    /**
     * 프롬프트 템플릿 조회
     */
    @GetMapping("/{id}")
    fun getPromptTemplate(
        @PathVariable id: String
    ): ResponseEntity<PromptTemplateResponse> {
        val template = promptManagementService.getPromptTemplate(PromptId.from(id))
        return ResponseEntity.ok(PromptTemplateResponse.from(template))
    }

    /**
     * 프롬프트 템플릿 수정
     */
    @PutMapping("/{id}")
    fun updatePromptTemplate(
        @PathVariable id: String,
        @RequestBody request: UpdatePromptTemplateRequest
    ): ResponseEntity<PromptTemplateResponse> {
        val template = promptManagementService.updatePromptTemplate(
            id = PromptId.from(id),
            name = request.name,
            description = request.description,
            template = request.template,
            variables = request.variables,
            systemMessage = request.systemMessage,
            temperature = request.temperature,
            maxTokens = request.maxTokens
        )

        return ResponseEntity.ok(PromptTemplateResponse.from(template))
    }

    /**
     * 프롬프트 템플릿 활성화
     */
    @PostMapping("/{id}/activate")
    fun activatePromptTemplate(
        @PathVariable id: String
    ): ResponseEntity<PromptTemplateResponse> {
        val template = promptManagementService.activatePromptTemplate(PromptId.from(id))
        return ResponseEntity.ok(PromptTemplateResponse.from(template))
    }

    /**
     * 프롬프트 템플릿 보관
     */
    @PostMapping("/{id}/archive")
    fun archivePromptTemplate(
        @PathVariable id: String
    ): ResponseEntity<PromptTemplateResponse> {
        val template = promptManagementService.archivePromptTemplate(PromptId.from(id))
        return ResponseEntity.ok(PromptTemplateResponse.from(template))
    }

    /**
     * 프롬프트 템플릿 삭제
     */
    @DeleteMapping("/{id}")
    fun deletePromptTemplate(
        @PathVariable id: String
    ): ResponseEntity<Void> {
        promptManagementService.deletePromptTemplate(PromptId.from(id))
        return ResponseEntity.noContent().build()
    }

    /**
     * 프롬프트 실행
     */
    @PostMapping("/{id}/execute")
    fun executePrompt(
        @PathVariable id: String,
        @RequestBody request: ExecutePromptRequest,
        @RequestParam(required = false) userId: String?
    ): ResponseEntity<PromptExecutionResponse> {
        val execution = promptExecutionService.executePrompt(
            promptId = PromptId.from(id),
            userId = userId?.let { UserId(java.util.UUID.fromString(it)) },
            input = request.input
        )

        return ResponseEntity.ok(PromptExecutionResponse.from(execution))
    }

    /**
     * 프롬프트 실행 이력 조회
     */
    @GetMapping("/{id}/executions")
    fun getExecutionsByPromptId(
        @PathVariable id: String
    ): ResponseEntity<List<PromptExecutionResponse>> {
        val executions = promptExecutionService.getExecutionsByPromptId(PromptId.from(id))
        return ResponseEntity.ok(executions.map { PromptExecutionResponse.from(it) })
    }

    /**
     * 특정 실행 조회
     */
    @GetMapping("/executions/{executionId}")
    fun getExecution(
        @PathVariable executionId: String
    ): ResponseEntity<PromptExecutionResponse> {
        val execution = promptExecutionService.getExecution(PromptExecutionId.from(executionId))
        return ResponseEntity.ok(PromptExecutionResponse.from(execution))
    }
}
