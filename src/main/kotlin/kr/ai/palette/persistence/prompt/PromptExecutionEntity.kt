package kr.ai.palette.persistence.prompt

import jakarta.persistence.*
import kr.ai.palette.domain.prompt.ExecutionStatus
import java.time.LocalDateTime

@Entity
@Table(name = "prompt_executions")
class PromptExecutionEntity(
    @Id
    @Column(name = "id", nullable = false, length = 36)
    var id: String,

    @Column(name = "prompt_id", nullable = false, length = 36)
    var promptId: String,

    @Column(name = "user_id", length = 36)
    var userId: String?,

    @Column(name = "input", nullable = false, columnDefinition = "TEXT")
    var input: String, // JSON object stored as string

    @Column(name = "output", columnDefinition = "TEXT")
    var output: String?,

    @Column(name = "tokens_used")
    var tokensUsed: Int?,

    @Column(name = "duration_ms")
    var durationMs: Long?,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: ExecutionStatus,

    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String?,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime
)
