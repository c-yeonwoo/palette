package kr.ai.palette.domain.user

import java.time.Instant

data class UserMetadata(
    val createdAt: Instant,
    val updatedAt: Instant = createdAt,
    val lastLoginAt: Instant = createdAt,
    val deletedAt: Instant? = null
) {
    fun isDeleted(): Boolean = deletedAt != null

    fun updateLogin(): UserMetadata {
        return copy(
            lastLoginAt = Instant.now(),
            updatedAt = Instant.now()
        )
    }

    fun delete(): UserMetadata {
        return copy(
            deletedAt = Instant.now(),
            updatedAt = Instant.now()
        )
    }
}
