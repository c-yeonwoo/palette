package kr.ai.palette.domain.prompt

import java.time.LocalDateTime

/**
 * 프롬프트 템플릿 Aggregate Root
 *
 * AI 요약 및 분석을 위한 프롬프트 템플릿을 관리합니다.
 */
data class PromptTemplate(
    val id: PromptId,
    val name: String,
    val description: String,
    val category: PromptCategory,
    val template: String,
    val variables: List<String>,
    val systemMessage: String?,
    val temperature: Double,
    val maxTokens: Int,
    val version: Int,
    val status: PromptStatus,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    init {
        require(name.isNotBlank()) { "Prompt name cannot be blank" }
        require(template.isNotBlank()) { "Prompt template cannot be blank" }
        require(temperature in 0.0..2.0) { "Temperature must be between 0.0 and 2.0" }
        require(maxTokens > 0) { "Max tokens must be positive" }
        require(version > 0) { "Version must be positive" }
        validateVariables()
    }

    /**
     * 템플릿에 선언된 변수가 실제로 템플릿 문자열에 존재하는지 검증
     */
    private fun validateVariables() {
        variables.forEach { variable ->
            require(template.contains("{$variable}")) {
                "Variable '$variable' is declared but not found in template"
            }
        }
    }

    /**
     * 프롬프트를 활성화
     */
    fun activate(): PromptTemplate {
        require(status == PromptStatus.DRAFT) { "Can only activate DRAFT prompts" }
        return copy(
            status = PromptStatus.ACTIVE,
            updatedAt = LocalDateTime.now()
        )
    }

    /**
     * 프롬프트를 보관
     */
    fun archive(): PromptTemplate {
        require(status == PromptStatus.ACTIVE) { "Can only archive ACTIVE prompts" }
        return copy(
            status = PromptStatus.ARCHIVED,
            updatedAt = LocalDateTime.now()
        )
    }

    /**
     * 프롬프트 템플릿 수정
     */
    fun update(
        name: String? = null,
        description: String? = null,
        template: String? = null,
        variables: List<String>? = null,
        systemMessage: String? = null,
        temperature: Double? = null,
        maxTokens: Int? = null
    ): PromptTemplate {
        return copy(
            name = name ?: this.name,
            description = description ?: this.description,
            template = template ?: this.template,
            variables = variables ?: this.variables,
            systemMessage = systemMessage ?: this.systemMessage,
            temperature = temperature ?: this.temperature,
            maxTokens = maxTokens ?: this.maxTokens,
            version = this.version + 1,
            updatedAt = LocalDateTime.now()
        )
    }

    /**
     * 입력 변수로 프롬프트 빌드
     */
    fun buildPrompt(input: Map<String, String>): String {
        var result = template

        // 모든 필수 변수가 제공되었는지 확인
        variables.forEach { variable ->
            require(input.containsKey(variable)) {
                "Required variable '$variable' is missing in input"
            }
        }

        // 변수를 실제 값으로 치환
        input.forEach { (key, value) ->
            result = result.replace("{$key}", value)
        }

        return result
    }

    companion object {
        /**
         * 새 프롬프트 템플릿 생성
         */
        fun create(
            name: String,
            description: String,
            category: PromptCategory,
            template: String,
            variables: List<String>,
            systemMessage: String? = null,
            temperature: Double = 0.7,
            maxTokens: Int = 1000
        ): PromptTemplate {
            val now = LocalDateTime.now()
            return PromptTemplate(
                id = PromptId.generate(),
                name = name,
                description = description,
                category = category,
                template = template,
                variables = variables,
                systemMessage = systemMessage,
                temperature = temperature,
                maxTokens = maxTokens,
                version = 1,
                status = PromptStatus.DRAFT,
                createdAt = now,
                updatedAt = now
            )
        }
    }
}
