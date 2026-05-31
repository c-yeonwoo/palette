package kr.ai.palette.persistence.recommendation

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate
import java.util.UUID

interface AdminBlockedTargetJpaRepository : JpaRepository<AdminBlockedTargetEntity, Long> {

    /** 활성 차단 (expiresAt null 또는 미래) target 목록 — 후보 필터용 */
    @Query("""
        SELECT b.targetUserId FROM AdminBlockedTargetEntity b
        WHERE b.viewerUserId = :viewerUserId
          AND (b.expiresAt IS NULL OR b.expiresAt >= :today)
    """)
    fun findActiveBlockedTargetIds(
        @Param("viewerUserId") viewerUserId: UUID,
        @Param("today") today: LocalDate,
    ): List<UUID>

    /** 운영자 화면용: viewer 의 차단 목록 */
    fun findByViewerUserIdOrderByCreatedAtDesc(viewerUserId: UUID): List<AdminBlockedTargetEntity>

    fun deleteByViewerUserIdAndTargetUserId(viewerUserId: UUID, targetUserId: UUID): Long
}
