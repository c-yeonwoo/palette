package kr.ai.palette.domain.profile

import java.time.Instant

data class ProfileMetadata(
    val createdAt: Instant,
    val updatedAt: Instant = createdAt,
    val lastAccessedAt: Instant = createdAt,
    val deletedAt: Instant? = null
) {
    fun isDeleted(): Boolean = deletedAt != null

    fun access(): ProfileMetadata {
        return copy(lastAccessedAt = Instant.now())
    }

    fun update(): ProfileMetadata {
        return copy(updatedAt = Instant.now())
    }

    fun delete(): ProfileMetadata {
        return copy(
            deletedAt = Instant.now(),
            updatedAt = Instant.now()
        )
    }
}
