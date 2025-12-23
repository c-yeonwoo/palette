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

    @Column(name = "profile_id", nullable = false, unique = true, columnDefinition = "BINARY(16)")
    var profileId: UUID,

    @Column(name = "s3_key", nullable = false, columnDefinition = "TEXT")
    var s3Key: String,

    @Column(name = "url", nullable = false, columnDefinition = "TEXT")
    var url: String,

    @Column(name = "thumbnail_url", nullable = false, columnDefinition = "TEXT")
    var thumbnailUrl: String,

    @Column(name = "duration_seconds", nullable = false)
    var durationSeconds: Int,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now()
) {
    protected constructor() : this(
        id = UUID.randomUUID(),
        profileId = UUID.randomUUID(),
        s3Key = "",
        url = "",
        thumbnailUrl = "",
        durationSeconds = 0
    )
}
