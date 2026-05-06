package kr.ai.palette.persistence.matchmaker

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface MatchmakerReviewJpaRepository : JpaRepository<MatchmakerReviewEntity, UUID> {
    fun findByMatchmakerId(matchmakerId: UUID): List<MatchmakerReviewEntity>
}
