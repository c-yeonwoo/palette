package kr.ai.palette.palettepick.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ProfileEmbeddingJpaRepository : JpaRepository<ProfileEmbeddingEntity, UUID> {
    fun findByUserIdIn(userIds: Collection<UUID>): List<ProfileEmbeddingEntity>
}
