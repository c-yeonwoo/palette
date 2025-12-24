package kr.ai.palette.persistence.profile

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "profile_videos")
class ProfileVideoEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    var id: UUID,

    @Column(name = "profile_id", nullable = false, columnDefinition = "BINARY(16)")
    var profileId: UUID,

    @Column(name = "s3_key", nullable = false, length = 500)
    var s3Key: String,

    @Column(name = "url", nullable = false, length = 1000)
    var url: String,

    @Column(name = "thumbnail_url", nullable = false, length = 1000)
    var thumbnailUrl: String,

    @Column(name = "duration_seconds", nullable = false)
    var durationSeconds: Int,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant
)
