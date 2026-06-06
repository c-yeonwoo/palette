package kr.ai.palette.application.safety

import kr.ai.palette.persistence.safety.BlockJpaRepository
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * 차단 양방향 격리 헬퍼 (어뷰징 방지 — ADR 0023).
 * 피드/AI시그널/매칭/검색에서 "내가 차단했거나 나를 차단한" 상대를 모두 제외.
 */
@Service
class BlockService(
    private val blockJpaRepository: BlockJpaRepository
) {
    /** userId 와 차단 관계(양방향)인 모든 상대 userId 집합 */
    fun blockedCounterpartIds(userId: UUID): Set<UUID> =
        blockJpaRepository.findByBlockerUserIdOrBlockedUserId(userId, userId)
            .map { if (it.blockerUserId == userId) it.blockedUserId else it.blockerUserId }
            .toSet()

    /** 두 사용자가 어느 방향으로든 차단 관계인가 */
    fun isBlockedBetween(a: UUID, b: UUID): Boolean =
        blockJpaRepository.existsByBlockerUserIdAndBlockedUserId(a, b) ||
            blockJpaRepository.existsByBlockerUserIdAndBlockedUserId(b, a)
}
