package kr.ai.palette.domain.prompt

import kr.ai.palette.domain.common.UserId
import java.time.LocalDateTime

/**
 * 프롬프트 실행 이력 Entity
 *
 * 프롬프트가 실행된 이력을 추적합니다.
 */
data class PromptExecution(
    val id: PromptExecutionId,
    val promptId: PromptId,
    val userId: UserId?,
    val input: Map<String, String>,
    val output: String?,
    val tokensUsed: Int?,
    val durationMs: Long?,
    val status: ExecutionStatus,
    val errorMessage: String?,
    val createdAt: LocalDateTime
) {
    init {
        require(input.isNotEmpty()) { "Input cannot be empty" }
        if (status == ExecutionStatus.SUCCESS) {
            require(output != null) { "Output must be present for successful execution" }
        }
        if (status == ExecutionStatus.FAILED) {
            require(errorMessage != null) { "Error message must be present for failed execution" }
        }
    }

    /**
     * 실행 완료 처리 (성공)
     */
    fun complete(output: String, tokensUsed: Int, durationMs: Long): PromptExecution {
        require(status == ExecutionStatus.IN_PROGRESS) { "Can only complete IN_PROGRESS executions" }
        return copy(
            output = output,
            tokensUsed = tokensUsed,
            durationMs = durationMs,
            status = ExecutionStatus.SUCCESS
        )
    }

    /**
     * 실행 실패 처리
     */
    fun fail(errorMessage: String, durationMs: Long? = null): PromptExecution {
        require(status == ExecutionStatus.IN_PROGRESS) { "Can only fail IN_PROGRESS executions" }
        return copy(
            errorMessage = errorMessage,
            durationMs = durationMs,
            status = ExecutionStatus.FAILED
        )
    }

    /**
     * 시간 초과 처리
     */
    fun timeout(durationMs: Long): PromptExecution {
        require(status == ExecutionStatus.IN_PROGRESS) { "Can only timeout IN_PROGRESS executions" }
        return copy(
            errorMessage = "Execution timed out after ${durationMs}ms",
            durationMs = durationMs,
            status = ExecutionStatus.TIMEOUT
        )
    }

    companion object {
        /**
         * 새 실행 시작
         */
        fun start(
            promptId: PromptId,
            userId: UserId?,
            input: Map<String, String>
        ): PromptExecution {
            return PromptExecution(
                id = PromptExecutionId.generate(),
                promptId = promptId,
                userId = userId,
                input = input,
                output = null,
                tokensUsed = null,
                durationMs = null,
                status = ExecutionStatus.IN_PROGRESS,
                errorMessage = null,
                createdAt = LocalDateTime.now()
            )
        }
    }
}
