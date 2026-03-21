package kr.ai.palette.domain.prompt

import java.util.UUID

@JvmInline
value class PromptExecutionId(val value: String) {
    init {
        require(value.isNotBlank()) { "PromptExecutionId cannot be blank" }
    }

    companion object {
        fun generate(): PromptExecutionId = PromptExecutionId(UUID.randomUUID().toString())
        fun from(value: String): PromptExecutionId = PromptExecutionId(value)
    }
}
