package kr.ai.palette.persistence.sharelink

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "share_links",
    indexes = [Index(name = "idx_share_link_user_id", columnList = "user_id", unique = true)]
)
class ShareLinkEntity(
    @Id
    val code: String,

    @Column(name = "user_id", nullable = false, unique = true)
    val userId: UUID,

    @Column(name = "view_count", nullable = false)
    val viewCount: Int = 0,

    @Column(name = "expires_at")
    val expiresAt: Instant? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: Instant = Instant.now()
)
