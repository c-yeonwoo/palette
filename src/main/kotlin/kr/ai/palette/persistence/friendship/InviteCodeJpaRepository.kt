package kr.ai.palette.persistence.friendship

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.util.UUID

interface InviteCodeJpaRepository : JpaRepository<InviteCodeEntity, UUID> {
    fun findByCode(code: String): InviteCodeEntity?
    fun deleteByUserId(userId: UUID)

    @Modifying
    @Query("DELETE FROM InviteCodeEntity i WHERE i.expiresAt < :now")
    fun deleteExpired(now: Instant): Int
}
