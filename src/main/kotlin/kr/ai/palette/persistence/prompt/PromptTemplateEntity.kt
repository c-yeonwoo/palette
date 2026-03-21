package kr.ai.palette.persistence.prompt

import jakarta.persistence.*
import kr.ai.palette.domain.prompt.PromptCategory
import kr.ai.palette.domain.prompt.PromptStatus
import java.time.LocalDateTime

@Entity
@Table(name = "prompt_templates")
class PromptTemplateEntity(
    @Id
    @Column(name = "id", nullable = false, length = 36)
    var id: String,

    @Column(name = "name", nullable = false, length = 200)
    var name: String,

    @Column(name = "description", nullable = false, length = 1000)
    var description: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    var category: PromptCategory,

    @Column(name = "template", nullable = false, columnDefinition = "TEXT")
    var template: String,

    @Column(name = "variables", nullable = false, columnDefinition = "TEXT")
    var variables: String, // JSON array stored as string

    @Column(name = "system_message", columnDefinition = "TEXT")
    var systemMessage: String?,

    @Column(name = "temperature", nullable = false)
    var temperature: Double,

    @Column(name = "max_tokens", nullable = false)
    var maxTokens: Int,

    @Column(name = "version", nullable = false)
    var version: Int,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: PromptStatus,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime
)
