package kr.ai.palette.palettepick.application

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.persistence.matchmaking.MatchmakingRequestJpaRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.UUID
import kotlin.math.tanh

/**
 * 활동 모멘텀 — 최근 7일 매칭 요청 보낸 수 + 받은 수 정규화 (ADR 0047 §B.3).
 *
 * PalettePickScore.momentum 축 (가중치 15%) — 활성 사용자 우선 추천.
 * tanh 스무딩 — 1건만 있어도 충분히 활성으로 인정 (0.7), 10건+ 은 ~1.0 plateau.
 */
@Service
class ActivityMomentumService(
    private val matchmakingRequestRepository: MatchmakingRequestJpaRepository,
) {

    /**
     * 단건 momentum 점수 0..1.
     */
    fun momentum(userId: UserId): Double = momentum(userId.value)

    fun momentum(userId: UUID): Double {
        val since = LocalDateTime.now().minusDays(WINDOW_DAYS)
        val sent = matchmakingRequestRepository.findByRequesterId(userId)
            .count { it.createdAt.isAfter(since) }
        val received = matchmakingRequestRepository.findByTargetUserId(userId)
            .count { it.createdAt.isAfter(since) }
        val activity = sent + received
        // tanh 스무딩 — activity 0 → 0.0, 1 → 0.46, 3 → 0.83, 10 → ~1.0
        return tanh(activity / SMOOTHING.toDouble()).coerceIn(0.0, 1.0)
    }

    /** 배치 일괄 — 후보 풀 전체에 대해 한 번에 (N+1 회피용). */
    fun batchMomentum(userIds: List<UUID>): Map<UUID, Double> {
        return userIds.associateWith { momentum(it) }
        // 베타 단계 단순. 사용자 1만 명+ 시 native query 로 group-by-counts 최적화 검토.
    }

    companion object {
        const val WINDOW_DAYS: Long = 7
        const val SMOOTHING: Int = 2  // tanh divisor — 2 면 activity=2 → 0.76, activity=4 → 0.96
    }
}
