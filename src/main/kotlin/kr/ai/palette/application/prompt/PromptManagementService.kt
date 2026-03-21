package kr.ai.palette.application.prompt

import kr.ai.palette.domain.prompt.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * 프롬프트 템플릿 관리 서비스
 */
@Service
@Transactional
class PromptManagementService(
    private val promptTemplateRepository: PromptTemplateRepository
) {
    /**
     * 프롬프트 템플릿 생성
     */
    fun createPromptTemplate(
        name: String,
        description: String,
        category: PromptCategory,
        template: String,
        variables: List<String>,
        systemMessage: String? = null,
        temperature: Double = 0.7,
        maxTokens: Int = 1000
    ): PromptTemplate {
        val promptTemplate = PromptTemplate.create(
            name = name,
            description = description,
            category = category,
            template = template,
            variables = variables,
            systemMessage = systemMessage,
            temperature = temperature,
            maxTokens = maxTokens
        )

        return promptTemplateRepository.save(promptTemplate)
    }

    /**
     * 프롬프트 템플릿 조회
     */
    @Transactional(readOnly = true)
    fun getPromptTemplate(id: PromptId): PromptTemplate {
        return promptTemplateRepository.findById(id)
            ?: throw IllegalArgumentException("Prompt template not found: ${id.value}")
    }

    /**
     * 모든 프롬프트 템플릿 조회
     */
    @Transactional(readOnly = true)
    fun getAllPromptTemplates(): List<PromptTemplate> {
        return promptTemplateRepository.findAll()
    }

    /**
     * 활성화된 프롬프트 템플릿만 조회
     */
    @Transactional(readOnly = true)
    fun getActivePromptTemplates(): List<PromptTemplate> {
        return promptTemplateRepository.findAllActive()
    }

    /**
     * 카테고리별 프롬프트 템플릿 조회
     */
    @Transactional(readOnly = true)
    fun getPromptTemplatesByCategory(category: PromptCategory): List<PromptTemplate> {
        return promptTemplateRepository.findByCategory(category)
    }

    /**
     * 프롬프트 템플릿 수정
     */
    fun updatePromptTemplate(
        id: PromptId,
        name: String? = null,
        description: String? = null,
        template: String? = null,
        variables: List<String>? = null,
        systemMessage: String? = null,
        temperature: Double? = null,
        maxTokens: Int? = null
    ): PromptTemplate {
        val existingPrompt = getPromptTemplate(id)

        val updatedPrompt = existingPrompt.update(
            name = name,
            description = description,
            template = template,
            variables = variables,
            systemMessage = systemMessage,
            temperature = temperature,
            maxTokens = maxTokens
        )

        return promptTemplateRepository.save(updatedPrompt)
    }

    /**
     * 프롬프트 템플릿 활성화
     */
    fun activatePromptTemplate(id: PromptId): PromptTemplate {
        val prompt = getPromptTemplate(id)
        val activated = prompt.activate()
        return promptTemplateRepository.save(activated)
    }

    /**
     * 프롬프트 템플릿 보관
     */
    fun archivePromptTemplate(id: PromptId): PromptTemplate {
        val prompt = getPromptTemplate(id)
        val archived = prompt.archive()
        return promptTemplateRepository.save(archived)
    }

    /**
     * 프롬프트 템플릿 삭제
     */
    fun deletePromptTemplate(id: PromptId) {
        if (!promptTemplateRepository.existsById(id)) {
            throw IllegalArgumentException("Prompt template not found: ${id.value}")
        }
        promptTemplateRepository.delete(id)
    }
}
