package kr.ai.palette.persistence.ai

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "user_ai_insights")
class UserAiInsightEntity(
    @Id
    @Column(name = "user_id", columnDefinition = "BINARY(16)")
    val userId: UUID,

    @Column(nullable = true, length = 30)
    var attachmentStyle: String? = null,

    @Column(nullable = true, length = 40)
    var loveLanguage: String? = null,

    @Column(nullable = false)
    var updatedAt: Instant = Instant.now(),
) {
    protected constructor() : this(userId = UUID.randomUUID())
}
