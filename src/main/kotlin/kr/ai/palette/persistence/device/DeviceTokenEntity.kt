package kr.ai.palette.persistence.device

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "device_tokens",
    uniqueConstraints = [UniqueConstraint(columnNames = ["token"])],
    indexes = [Index(name = "idx_device_token_user_id", columnList = "user_id")]
)
class DeviceTokenEntity(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: String,

    @Column(nullable = false, unique = true, length = 512)
    val token: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val platform: DevicePlatform,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: Instant = Instant.now()
)

enum class DevicePlatform { ANDROID, IOS, WEB }
