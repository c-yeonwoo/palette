package kr.ai.palette.persistence.matchmaker

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface NudgeJpaRepository : JpaRepository<NudgeEntity, UUID> {
    fun findByMatchmakerUserIdOrderByProposedAtDesc(matchmakerUserId: UUID): List<NudgeEntity>
}
