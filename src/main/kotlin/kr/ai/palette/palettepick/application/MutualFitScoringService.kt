package kr.ai.palette.palettepick.application

import kr.ai.palette.palettepick.domain.PalettePickScore
import kr.ai.palette.palettepick.persistence.ProfileEmbeddingEntity
import kr.ai.palette.palettepick.persistence.ProfileEmbeddingJpaRepository
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * 양방향 적합도 + 자기소개 유사도 + 색궁합 + 활동 모멘텀 점수 계산 (ADR 0047 §B.3).
 *
 * 모두 deterministic — LLM 호출 X. DB(임베딩 벡터) + 정적 규칙 만 사용.
 * Stage 3 LLM 종합 분석 (B.2 PR) 의 입력으로도 사용.
 */
@Service
class MutualFitScoringService(
    private val embeddingRepository: ProfileEmbeddingJpaRepository,
) {

    /**
     * A↔B 매칭 점수 계산.
     *
     * @param viewerId 추천 받는 사용자 (A)
     * @param candidateId 추천 후보 (B)
     * @param colorCompatibilityRaw 색 궁합 raw (0.5~0.9) — 호출 측에서 색 매핑 후 전달
     * @param momentumRaw 활동 모멘텀 raw (0..1) — 호출 측에서 최근 7일 통계 정규화
     */
    fun score(
        viewerId: UUID,
        candidateId: UUID,
        colorCompatibilityRaw: Double = 0.5,
        momentumRaw: Double = 0.5,
    ): PalettePickScore {
        val (a, b) = loadPair(viewerId, candidateId) ?: return PalettePickScore(
            colorCompatibility = colorCompatibilityRaw,
            momentum = momentumRaw,
        )
        return scoreWithEmbeddings(a, b, colorCompatibilityRaw, momentumRaw)
    }

    /** 이미 로드된 임베딩으로 점수 계산 (배치에서 N+1 회피용). */
    fun scoreWithEmbeddings(
        viewer: ProfileEmbeddingEntity,
        candidate: ProfileEmbeddingEntity,
        colorCompatibilityRaw: Double,
        momentumRaw: Double,
    ): PalettePickScore {
        val aIntro = ProfileEmbeddingEntity.unpack(viewer.introEmbedding)
        val aIdeal = ProfileEmbeddingEntity.unpack(viewer.idealEmbedding)
        val bIntro = ProfileEmbeddingEntity.unpack(candidate.introEmbedding)
        val bIdeal = ProfileEmbeddingEntity.unpack(candidate.idealEmbedding)

        // 상호 이상형 적합도 (곱셈) — clamp 양수 영역 (음수 코사인은 0 처리)
        val aIdealFit = ProfileEmbeddingEntity.cosineSimilarity(aIdeal, bIntro).coerceAtLeast(0f).toDouble()
        val bIdealFit = ProfileEmbeddingEntity.cosineSimilarity(bIdeal, aIntro).coerceAtLeast(0f).toDouble()
        val mutualIdealFit = aIdealFit * bIdealFit

        // 자기소개 유사도 (0..1 clamp)
        val introSim = ProfileEmbeddingEntity.cosineSimilarity(aIntro, bIntro).coerceIn(0f, 1f).toDouble()

        return PalettePickScore(
            mutualIdealFit = mutualIdealFit,
            introSimilarity = introSim,
            colorCompatibility = colorCompatibilityRaw.coerceIn(0.0, 1.0),
            momentum = momentumRaw.coerceIn(0.0, 1.0),
        )
    }

    /**
     * 후보 풀에 대해 일괄 점수 계산 (N+1 회피).
     *
     * @param viewerId 추천 받는 사용자
     * @param candidateIds 후보 사용자들
     * @param contextProvider 후보별 (color, momentum) raw 점수 공급자 (호출 측이 채워서 전달)
     * @return userId → PalettePickScore (임베딩 없는 사용자는 mutualIdealFit=0)
     */
    fun batchScore(
        viewerId: UUID,
        candidateIds: List<UUID>,
        contextProvider: (UUID) -> Pair<Double, Double>,
    ): Map<UUID, PalettePickScore> {
        val viewer = embeddingRepository.findById(viewerId).orElse(null) ?: return emptyMap()
        val embeddings = embeddingRepository.findByUserIdIn(candidateIds).associateBy { it.userId }
        return candidateIds.associateWith { cid ->
            val (color, momentum) = contextProvider(cid)
            val candidate = embeddings[cid]
            if (candidate == null) {
                PalettePickScore(colorCompatibility = color, momentum = momentum)
            } else {
                scoreWithEmbeddings(viewer, candidate, color, momentum)
            }
        }
    }

    private fun loadPair(a: UUID, b: UUID): Pair<ProfileEmbeddingEntity, ProfileEmbeddingEntity>? {
        val embeddings = embeddingRepository.findByUserIdIn(listOf(a, b))
        if (embeddings.size < 2) return null
        val map = embeddings.associateBy { it.userId }
        val aEmb = map[a] ?: return null
        val bEmb = map[b] ?: return null
        return aEmb to bEmb
    }
}
