package kr.ai.palette.infrastructure.ai

import kr.ai.palette.application.prompt.AIResponse
import kr.ai.palette.application.prompt.AIService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient

/**
 * LangGraph AI 서비스 구현체
 *
 * Python LangGraph 서비스를 호출하여 AI 완성을 생성합니다.
 */
@Service
class LangGraphAIService(
    private val restClient: RestClient,
    @Value("\${langgraph.service.url:http://localhost:8001}")
    private val serviceUrl: String
) : AIService {

    override fun generateCompletion(
        prompt: String,
        systemMessage: String?,
        temperature: Double,
        maxTokens: Int
    ): AIResponse {
        val request = CompletionRequest(
            prompt = prompt,
            systemMessage = systemMessage,
            temperature = temperature,
            maxTokens = maxTokens
        )

        return try {
            val response = restClient.post()
                .uri("$serviceUrl/api/completion")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(CompletionResponse::class.java)
                ?: throw IllegalStateException("No response from AI service")

            AIResponse(
                content = response.content,
                tokensUsed = response.tokensUsed
            )
        } catch (e: Exception) {
            throw AIServiceException("Failed to generate completion: ${e.message}", e)
        }
    }

    /**
     * 프로필 요약 생성
     */
    fun generateProfileSummary(
        age: String,
        job: String,
        hobbies: String,
        personality: String
    ): AIResponse {
        val data = mapOf(
            "age" to age,
            "job" to job,
            "hobbies" to hobbies,
            "personality" to personality
        )

        return try {
            val response = restClient.post()
                .uri("$serviceUrl/api/profile-summary")
                .contentType(MediaType.APPLICATION_JSON)
                .body(data)
                .retrieve()
                .body(CompletionResponse::class.java)
                ?: throw IllegalStateException("No response from AI service")

            AIResponse(
                content = response.content,
                tokensUsed = response.tokensUsed
            )
        } catch (e: Exception) {
            throw AIServiceException("Failed to generate profile summary: ${e.message}", e)
        }
    }

    /**
     * 이상형 분석 생성
     */
    fun generateIdealTypeAnalysis(
        ageRange: String,
        heightRange: String,
        bodyTypes: List<String>,
        personalities: List<String>,
        dateStyle: String
    ): AIResponse {
        val data = mapOf(
            "age_range" to ageRange,
            "height_range" to heightRange,
            "body_types" to bodyTypes,
            "personalities" to personalities,
            "date_style" to dateStyle
        )

        return try {
            val response = restClient.post()
                .uri("$serviceUrl/api/ideal-type-analysis")
                .contentType(MediaType.APPLICATION_JSON)
                .body(data)
                .retrieve()
                .body(CompletionResponse::class.java)
                ?: throw IllegalStateException("No response from AI service")

            AIResponse(
                content = response.content,
                tokensUsed = response.tokensUsed
            )
        } catch (e: Exception) {
            throw AIServiceException("Failed to generate ideal type analysis: ${e.message}", e)
        }
    }
}

/**
 * AI 서비스 요청
 */
private data class CompletionRequest(
    val prompt: String,
    val systemMessage: String?,
    val temperature: Double,
    val maxTokens: Int
)

/**
 * AI 서비스 응답
 */
private data class CompletionResponse(
    val content: String,
    val tokensUsed: Int,
    val model: String
)

/**
 * AI 서비스 예외
 */
class AIServiceException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
