package kr.ai.palette.application.prompt

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.prompt.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * 프롬프트 실행 서비스
 */
@Service
@Transactional
class PromptExecutionService(
    private val promptTemplateRepository: PromptTemplateRepository,
    private val promptExecutionRepository: PromptExecutionRepository,
    private val aiService: AIService
) {
    /**
     * 프롬프트 실행
     */
    fun executePrompt(
        promptId: PromptId,
        userId: UserId?,
        input: Map<String, String>
    ): PromptExecution {
        // 1. 프롬프트 템플릿 조회
        val template = promptTemplateRepository.findById(promptId)
            ?: throw IllegalArgumentException("Prompt template not found: ${promptId.value}")

        require(template.status == PromptStatus.ACTIVE) {
            "Can only execute ACTIVE prompts"
        }

        // 2. 실행 시작
        val execution = PromptExecution.start(promptId, userId, input)
        var savedExecution = promptExecutionRepository.save(execution)

        return try {
            // 3. 프롬프트 빌드
            val builtPrompt = template.buildPrompt(input)
            val startTime = System.currentTimeMillis()

            // 4. AI API 호출
            val response = aiService.generateCompletion(
                prompt = builtPrompt,
                systemMessage = template.systemMessage,
                temperature = template.temperature,
                maxTokens = template.maxTokens
            )

            val duration = System.currentTimeMillis() - startTime

            // 5. 실행 완료
            savedExecution = savedExecution.complete(
                output = response.content,
                tokensUsed = response.tokensUsed,
                durationMs = duration
            )
            promptExecutionRepository.save(savedExecution)
        } catch (e: Exception) {
            // 6. 실행 실패 처리
            val duration = System.currentTimeMillis()
            savedExecution = savedExecution.fail(
                errorMessage = e.message ?: "Unknown error",
                durationMs = duration
            )
            promptExecutionRepository.save(savedExecution)
        }
    }

    /**
     * 실행 이력 조회
     */
    @Transactional(readOnly = true)
    fun getExecution(executionId: PromptExecutionId): PromptExecution {
        return promptExecutionRepository.findById(executionId)
            ?: throw IllegalArgumentException("Execution not found: ${executionId.value}")
    }

    /**
     * 프롬프트별 실행 이력 조회
     */
    @Transactional(readOnly = true)
    fun getExecutionsByPromptId(promptId: PromptId): List<PromptExecution> {
        return promptExecutionRepository.findByPromptId(promptId)
    }

    /**
     * 사용자별 실행 이력 조회
     */
    @Transactional(readOnly = true)
    fun getExecutionsByUserId(userId: UserId): List<PromptExecution> {
        return promptExecutionRepository.findByUserId(userId)
    }
}

/**
 * AI 서비스 인터페이스
 */
interface AIService {
    fun generateCompletion(
        prompt: String,
        systemMessage: String?,
        temperature: Double,
        maxTokens: Int
    ): AIResponse
}

/**
 * AI 응답
 */
data class AIResponse(
    val content: String,
    val tokensUsed: Int
)
