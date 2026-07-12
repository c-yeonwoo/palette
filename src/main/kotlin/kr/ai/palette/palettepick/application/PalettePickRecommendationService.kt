package kr.ai.palette.palettepick.application

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.ColorTypeEnum
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.User
import kr.ai.palette.palettepick.domain.PalettePickScore
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.UUID

/**
 * 팔레트픽 추천 오케스트레이터 (ADR 0047 §B.3).
 *
 * 파이프라인:
 *  1. CandidatePoolService — 지인망 + 필터 → 후보 ≤ 50
 *  2. EmbeddingRefreshService — stale 한 후보 임베딩 lazy 갱신 (배치 + viewer 본인)
 *  3. MutualFitScoringService.batchScore — 4축 결정적 스코어링
 *  4. Top-K 정렬 (현재 K=2 — AiSignalController 와 동일 한도)
 *
 * LLM 종합 분석 (B.3 PR) 은 이 결과를 Stage 3 입력으로 받음.
 */
@Service
class PalettePickRecommendationService(
    private val candidatePoolService: CandidatePoolService,
    private val embeddingRefreshService: EmbeddingRefreshService,
    private val scoringService: MutualFitScoringService,
    private val colorCompatibilityService: ColorCompatibilityService,
    private val activityMomentumService: ActivityMomentumService,
    private val profileRepository: ProfileRepository,
) {
    private val log = LoggerFactory.getLogger(PalettePickRecommendationService::class.java)

    /**
     * @param viewer 추천 받는 사용자
     * @param today 기준 일자 (KST)
     * @param topK 반환 후보 수 (기본 2 — 오늘의 추천 카드 수)
     * @return 점수 내림차순 정렬된 candidate UserId 목록 (mutualIdealFit 우선)
     */
    fun recommend(viewer: User, today: LocalDate = LocalDate.now(), topK: Int = 2): List<UUID> {
        val viewerUuid = viewer.id.value

        // Stage 1 — 후보 풀
        val pool = candidatePoolService.build(viewer, today)
        if (pool.isEmpty()) {
            log.debug("팔레트픽 후보 0 명 — viewer={}", viewerUuid)
            return emptyList()
        }

        // Stage 2 — stale 임베딩 lazy 갱신 (viewer 본인 + 후보들)
        embeddingRefreshService.refreshIfStale(viewerUuid)
        embeddingRefreshService.bulkRefreshIfStale(pool)

        // Stage 3 — 결정적 스코어링
        val viewerColor = viewer.colorType()
        val viewerProfile = profileRepository.findByUserId(viewer.id)
        val candidateColors: Map<UUID, ColorTypeEnum?> = pool.associateWith { uid ->
            profileRepository.findByUserId(UserId(uid))?.colorType?.type
        }
        val momentumBatch = activityMomentumService.batchMomentum(pool)

        val scores: Map<UUID, PalettePickScore> = scoringService.batchScore(
            viewerId = viewerUuid,
            candidateIds = pool,
        ) { candidateId ->
            val color = colorCompatibilityService.score(viewerColor, candidateColors[candidateId])
            val momentum = momentumBatch[candidateId] ?: 0.0
            color to momentum
        }

        // 콜드스타트 견고성 (ADR 0072) — viewer 임베딩이 아직 없어 스코어가 비면
        // 풀 순서(지인 우선 → 공개 거리순)를 그대로 사용해 카드가 비지 않게 한다.
        if (scores.isEmpty()) {
            log.debug("팔레트픽 스코어 0 (viewer 임베딩 미생성) — 거리순 풀 폴백 viewer={}", viewerUuid)
            return pool.take(topK)
        }

        // Stage 4 — Top-K (이상형 합치도 우선, 동률 시 자기소개 유사도)
        return scores.entries
            .sortedWith(
                compareByDescending<Map.Entry<UUID, PalettePickScore>> { it.value.total }
                    .thenByDescending { it.value.mutualIdealFit }
                    .thenByDescending { it.value.introSimilarity }
            )
            .take(topK)
            .map { it.key }
            .also {
                if (log.isDebugEnabled) {
                    log.debug(
                        "팔레트픽 추천 — viewer={} pool={} picked={}",
                        viewerUuid,
                        pool.size,
                        it,
                    )
                }
                // viewerProfile 미사용 시 컴파일러 경고 회피용 no-op
                viewerProfile?.let { _ -> /* future LLM Stage 3 입력 후보 */ }
            }
    }

    /** User.colorType() — User 도메인에 없을 수 있으니 프로필에서 가져오는 헬퍼. */
    private fun User.colorType(): ColorTypeEnum? =
        profileRepository.findByUserId(this.id)?.colorType?.type
}
