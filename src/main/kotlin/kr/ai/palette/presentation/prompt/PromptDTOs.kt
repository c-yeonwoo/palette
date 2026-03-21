package kr.ai.palette.presentation.prompt

import kr.ai.palette.domain.prompt.*
import java.time.LocalDateTime

/**
 * 프롬프트 템플릿 생성 요청
 */
data class CreatePromptTemplateRequest(
    val name: String,
    val description: String,
    val category: PromptCategory,
    val template: String,
    val variables: List<String>,
    val systemMessage: String? = null,
    val temperature: Double = 0.7,
    val maxTokens: Int = 1000
)

/**
 * 프롬프트 템플릿 수정 요청
 */
data class UpdatePromptTemplateRequest(
    val name: String? = null,
    val description: String? = null,
    val template: String? = null,
    val variables: List<String>? = null,
    val systemMessage: String? = null,
    val temperature: Double? = null,
    val maxTokens: Int? = null
)

/**
 * 프롬프트 실행 요청
 */
data class ExecutePromptRequest(
    val input: Map<String, String>
)

/**
 * 프롬프트 템플릿 응답
 */
data class PromptTemplateResponse(
    val id: String,
    val name: String,
    val description: String,
    val category: String,
    val template: String,
    val variables: List<String>,
    val systemMessage: String?,
    val temperature: Double,
    val maxTokens: Int,
    val version: Int,
    val status: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun from(domain: PromptTemplate): PromptTemplateResponse {
            return PromptTemplateResponse(
                id = domain.id.value,
                name = domain.name,
                description = domain.description,
                category = domain.category.name,
                template = domain.template,
                variables = domain.variables,
                systemMessage = domain.systemMessage,
                temperature = domain.temperature,
                maxTokens = domain.maxTokens,
                version = domain.version,
                status = domain.status.name,
                createdAt = domain.createdAt,
                updatedAt = domain.updatedAt
            )
        }
    }
}

/**
 * 프롬프트 실행 응답
 */
data class PromptExecutionResponse(
    val id: String,
    val promptId: String,
    val userId: String?,
    val input: Map<String, String>,
    val output: String?,
    val tokensUsed: Int?,
    val durationMs: Long?,
    val status: String,
    val errorMessage: String?,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(domain: PromptExecution): PromptExecutionResponse {
            return PromptExecutionResponse(
                id = domain.id.value,
                promptId = domain.promptId.value,
                userId = domain.userId?.value?.toString(),
                input = domain.input,
                output = domain.output,
                tokensUsed = domain.tokensUsed,
                durationMs = domain.durationMs,
                status = domain.status.name,
                errorMessage = domain.errorMessage,
                createdAt = domain.createdAt
            )
        }
    }
}
