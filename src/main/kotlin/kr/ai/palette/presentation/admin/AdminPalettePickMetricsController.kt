package kr.ai.palette.presentation.admin

import kr.ai.palette.palettepick.persistence.CompatibilityAnalysisJpaRepository
import kr.ai.palette.persistence.feed.CardOpenJpaRepository
import kr.ai.palette.persistence.friendship.FriendshipJpaRepository
import kr.ai.palette.persistence.friendship.FriendshipStatusEntity
import kr.ai.palette.persistence.recommendation.DailyRecommendationJpaRepository
import kr.ai.palette.persistence.recommendation.RecommendationSourceEntity
import kr.ai.palette.persistence.user.UserJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

/**
 * 팔레트픽 추천 알고리즘 관측 메트릭 (ADR 0047 §B.4).
 *
 * variant 별로:
 *  · 추천 건수 (DailyRecommendation count)
 *  · 카드 오픈률 (card_opens 매칭 수 / 추천 건수)
 *  · LLM 분석 캐시 보유율 (CompatibilityAnalysis 매칭 수 / 추천 건수)
 *
 * 사용 목적: 새 orchestrator 추천 품질 회귀 감지. 본격 A/B (control group)는 사용자
 * 규모 충분히 확보된 후 별도 PR.
 */
@RestController
@RequestMapping("/api/v1/admin/palette-pick/metrics")
class AdminPalettePickMetricsController(
    private val dailyRecommendationRepo: DailyRecommendationJpaRepository,
    private val cardOpenRepo: CardOpenJpaRepository,
    private val compatibilityAnalysisRepo: CompatibilityAnalysisJpaRepository,
    private val friendshipJpaRepository: FriendshipJpaRepository,
    private val userJpaRepository: UserJpaRepository,
) {

    /**
     * 최근 N일 (기본 7일) 윈도우 variant 별 통계.
     *
     * @param days 윈도우 일수 (1..30). default 7.
     */
    @GetMapping
    fun summary(
        @RequestParam(name = "days", required = false, defaultValue = "7") days: Int,
    ): ResponseEntity<Map<String, Any?>> {
        val safeDays = days.coerceIn(1, 30)
        val since = LocalDate.now().minusDays(safeDays.toLong())

        // 전체 추천을 메모리에 로드 후 그룹화 — 베타 단계 단순함 우선. 데이터 증가 시 native group-by 로 최적화.
        val recommendations = dailyRecommendationRepo.findAll()
            .filter { it.recommendedDate >= since && it.source == RecommendationSourceEntity.AUTO }

        if (recommendations.isEmpty()) {
            return ResponseEntity.ok(
                mapOf(
                    "windowDays" to safeDays,
                    "totalRecommendations" to 0,
                    "variants" to emptyList<Any>(),
                    "bySource" to emptyList<Any>(),
                    "networkDensity" to buildNetworkDensity(),
                    "note" to "최근 $safeDays 일 자동 추천 데이터 없음",
                )
            )
        }

        // (viewer, target) → opened? 빠른 lookup. card_opens 전체 fetch — 적은 데이터 가정.
        val openedPairs: Set<Pair<java.util.UUID, java.util.UUID>> =
            cardOpenRepo.findAll().mapTo(mutableSetOf()) { it.viewerId to it.targetUserId }

        // (viewer, candidate) → LLM 분석 보유 여부
        val analyzedPairs: Set<Pair<java.util.UUID, java.util.UUID>> =
            compatibilityAnalysisRepo.findAll().mapTo(mutableSetOf()) { it.viewerUserId to it.candidateUserId }

        val byVariant = recommendations.groupBy { it.variant ?: VARIANT_UNTAGGED }

        val variantStats = byVariant.entries
            .sortedByDescending { it.value.size }
            .map { (variant, list) ->
                val total = list.size
                val opened = list.count { (it.viewerUserId to it.targetUserId) in openedPairs }
                val analyzed = list.count { (it.viewerUserId to it.targetUserId) in analyzedPairs }
                mapOf(
                    "variant" to variant,
                    "count" to total,
                    "opens" to opened,
                    "openRate" to ratio(opened, total),
                    "analyzed" to analyzed,
                    "analysisCoverage" to ratio(analyzed, total),
                )
            }

        // 후보 티어 출처 분해 (CS-010, ADR 0072) — 콜드스타트 공개 풀이 실제로 추천을 태우고 있나?
        val bySource = recommendations.groupBy { it.candidateSource?.name ?: SOURCE_UNTAGGED }
        val sourceStats = bySource.entries
            .sortedByDescending { it.value.size }
            .map { (source, list) ->
                val total = list.size
                val opened = list.count { (it.viewerUserId to it.targetUserId) in openedPairs }
                mapOf(
                    "source" to source,
                    "count" to total,
                    "share" to ratio(total, recommendations.size),
                    "opens" to opened,
                    "openRate" to ratio(opened, total),
                )
            }

        return ResponseEntity.ok(
            mapOf(
                "windowDays" to safeDays,
                "totalRecommendations" to recommendations.size,
                "uniqueViewers" to recommendations.map { it.viewerUserId }.distinct().size,
                "variants" to variantStats,
                "bySource" to sourceStats,
                "networkDensity" to buildNetworkDensity(),
            )
        )
    }

    /**
     * 네트워크 밀도 (CS-010) — 지인 그래프가 densify 되고 있는지.
     * friendships 는 무방향(쌍당 1 row) → 엣지 1개 = 2명의 degree. 평균 친구 수 = 2·엣지 / 유저.
     */
    private fun buildNetworkDensity(): Map<String, Any?> {
        val acceptedEdges = friendshipJpaRepository.findAll().count { it.status == FriendshipStatusEntity.ACCEPTED }
        val totalUsers = userJpaRepository.count().toInt()
        val avgFriends = if (totalUsers == 0) 0.0 else ((2.0 * acceptedEdges / totalUsers) * 100).toInt() / 100.0
        return mapOf(
            "acceptedEdges" to acceptedEdges,
            "totalUsers" to totalUsers,
            "avgFriendsPerUser" to avgFriends,
        )
    }

    private fun ratio(numerator: Int, denominator: Int): Double =
        if (denominator == 0) 0.0 else (numerator.toDouble() / denominator).let { (it * 1000).toInt() / 1000.0 }

    companion object {
        /** variant 컬럼이 null 인 추천(B.4 이전 row)을 묶을 라벨. */
        const val VARIANT_UNTAGGED = "UNTAGGED"

        /** candidate_source 컬럼이 null 인 추천(CS-010 이전 row)을 묶을 라벨. */
        const val SOURCE_UNTAGGED = "UNTAGGED"
    }
}
