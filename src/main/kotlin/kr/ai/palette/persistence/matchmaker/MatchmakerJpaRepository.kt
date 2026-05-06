package kr.ai.palette.persistence.matchmaker

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface MatchmakerJpaRepository : JpaRepository<MatchmakerEntity, UUID> {
    fun findByUserId(userId: UUID): MatchmakerEntity?
    fun existsByUserId(userId: UUID): Boolean
    fun findByIsPublicProfileTrue(pageable: Pageable): List<MatchmakerEntity>
}
