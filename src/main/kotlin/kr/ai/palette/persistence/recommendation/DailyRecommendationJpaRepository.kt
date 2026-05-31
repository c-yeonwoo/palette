package kr.ai.palette.persistence.recommendation

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate
import java.util.UUID

interface DailyRecommendationJpaRepository : JpaRepository<DailyRecommendationEntity, Long> {

    /** 특정 viewer 의 특정 날짜 추천 (position 오름차순) */
    fun findByViewerUserIdAndRecommendedDateOrderByPositionAsc(
        viewerUserId: UUID,
        recommendedDate: LocalDate,
    ): List<DailyRecommendationEntity>

    /** 60일(또는 N일) 이내 추천된 적 있는 target 목록 — 후보 필터용 */
    @Query("""
        SELECT DISTINCT d.targetUserId
        FROM DailyRecommendationEntity d
        WHERE d.viewerUserId = :viewerUserId
          AND d.recommendedDate >= :since
    """)
    fun findRecentlyRecommendedTargetIds(
        @Param("viewerUserId") viewerUserId: UUID,
        @Param("since") since: LocalDate,
    ): List<UUID>

    /** 운영자: 특정 날짜의 모든 추천 (viewer 별 그룹핑은 application 에서) */
    fun findByRecommendedDateOrderByViewerUserIdAscPositionAsc(
        recommendedDate: LocalDate,
    ): List<DailyRecommendationEntity>

    /** 운영자: 특정 viewer 의 최근 N일 추천 이력 */
    fun findByViewerUserIdAndRecommendedDateGreaterThanEqualOrderByRecommendedDateDescPositionAsc(
        viewerUserId: UUID,
        recommendedDate: LocalDate,
    ): List<DailyRecommendationEntity>

    /** 운영자: 어떤 사용자가 누구에게 추천됐는지 (역방향 조회) */
    fun findByTargetUserIdAndRecommendedDateGreaterThanEqualOrderByRecommendedDateDescPositionAsc(
        targetUserId: UUID,
        recommendedDate: LocalDate,
    ): List<DailyRecommendationEntity>
}
