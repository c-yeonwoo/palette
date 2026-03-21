package kr.ai.palette.persistence.prompt

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.prompt.PromptExecution
import kr.ai.palette.domain.prompt.PromptExecutionId
import kr.ai.palette.domain.prompt.PromptId
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class PromptExecutionMapper(
    private val objectMapper: ObjectMapper
) {
    fun toDomain(entity: PromptExecutionEntity): PromptExecution {
        return PromptExecution(
            id = PromptExecutionId.from(entity.id),
            promptId = PromptId.from(entity.promptId),
            userId = entity.userId?.let { UserId(UUID.fromString(it)) },
            input = objectMapper.readValue(entity.input),
            output = entity.output,
            tokensUsed = entity.tokensUsed,
            durationMs = entity.durationMs,
            status = entity.status,
            errorMessage = entity.errorMessage,
            createdAt = entity.createdAt
        )
    }

    fun toEntity(domain: PromptExecution): PromptExecutionEntity {
        return PromptExecutionEntity(
            id = domain.id.value,
            promptId = domain.promptId.value,
            userId = domain.userId?.value?.toString(),
            input = objectMapper.writeValueAsString(domain.input),
            output = domain.output,
            tokensUsed = domain.tokensUsed,
            durationMs = domain.durationMs,
            status = domain.status,
            errorMessage = domain.errorMessage,
            createdAt = domain.createdAt
        )
    }

    fun updateEntity(entity: PromptExecutionEntity, domain: PromptExecution) {
        entity.output = domain.output
        entity.tokensUsed = domain.tokensUsed
        entity.durationMs = domain.durationMs
        entity.status = domain.status
        entity.errorMessage = domain.errorMessage
    }
}
