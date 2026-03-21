package kr.ai.palette.domain.prompt

import java.util.UUID

@JvmInline
value class PromptId(val value: String) {
    init {
        require(value.isNotBlank()) { "PromptId cannot be blank" }
    }

    companion object {
        fun generate(): PromptId = PromptId(UUID.randomUUID().toString())
        fun from(value: String): PromptId = PromptId(value)
    }
}
