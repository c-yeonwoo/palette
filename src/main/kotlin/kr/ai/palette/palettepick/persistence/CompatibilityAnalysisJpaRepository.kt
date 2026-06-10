package kr.ai.palette.palettepick.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface CompatibilityAnalysisJpaRepository : JpaRepository<CompatibilityAnalysisEntity, UUID> {

    fun findByViewerUserIdAndCandidateUserId(viewerUserId: UUID, candidateUserId: UUID): CompatibilityAnalysisEntity?

    /** 추천 응답 시 N+1 회피 — viewer 의 후보 풀 일괄 조회. */
    fun findByViewerUserIdAndCandidateUserIdIn(
        viewerUserId: UUID,
        candidateUserIds: Collection<UUID>,
    ): List<CompatibilityAnalysisEntity>
}
