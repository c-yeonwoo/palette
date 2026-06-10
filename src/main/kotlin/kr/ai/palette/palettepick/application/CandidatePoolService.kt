package kr.ai.palette.palettepick.application

import kr.ai.palette.application.safety.BlockService
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.User
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.persistence.feed.FeedHideJpaRepository
import kr.ai.palette.persistence.recommendation.AdminBlockedTargetJpaRepository
import kr.ai.palette.persistence.recommendation.DailyRecommendationJpaRepository
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.UUID

/**
 * 팔레트픽 후보 풀 (ADR 0047 §B.3 Stage 1).
 *
 * 단계적 필터:
 *  · 2·3촌 풀 시작 (FriendshipRepository.findSecondDegreeFriendIds — 베타 단계)
 *  · 1촌 제외 (이미 아는 사이)
 *  · 자신 / 차단 / 숨김 / 60일 추천 이력 제외
 *  · 매칭 받기 OFF 제외 (ADR 0022 — Profile.settings.canReceiveMatches)
 *  · 운영자 차단 target 제외 (ADR 0011)
 *  · 유저간 차단 양방향 제외 (ADR 0023)
 *  · 동성 제외 (현재 정책 — heterosexual default)
 *
 * 반환 ≤ 50 (LLM 비용·계산 시간 보호).
 */
@Service
class CandidatePoolService(
    private val friendshipRepository: FriendshipRepository,
    private val profileRepository: ProfileRepository,
    private val userRepository: UserRepository,
    private val feedHideRepository: FeedHideJpaRepository,
    private val dailyRecommendationRepo: DailyRecommendationJpaRepository,
    private val adminBlockedTargetRepo: AdminBlockedTargetJpaRepository,
    private val blockService: BlockService,
) {

    /**
     * @param maxSize 후보 풀 최대 크기 (기본 50)
     * @return 매칭 가능한 candidate User IDs
     */
    fun build(viewer: User, today: LocalDate = LocalDate.now(), maxSize: Int = 50): List<UUID> {
        val viewerId = viewer.id
        val viewerUuid: UUID = viewerId.value

        val firstDegree: Set<UUID> = friendshipRepository.findFriendIdsByUserId(viewerId)
            .mapTo(mutableSetOf()) { it.value }
        val secondDegree: List<UUID> = friendshipRepository.findSecondDegreeFriendIds(viewerId)
            .map { it.value }
        val hidden: Set<UUID> = feedHideRepository.findAllByUserId(viewerUuid.toString())
            .mapTo(mutableSetOf()) { UUID.fromString(it.targetUserId) }
        val recentlyRecommended: Set<UUID> = dailyRecommendationRepo
            .findRecentlyRecommendedTargetIds(viewerUuid, today.minusDays(EXCLUSION_DAYS))
            .toSet()
        val adminBlocked: Set<UUID> = adminBlockedTargetRepo
            .findActiveBlockedTargetIds(viewerUuid, today)
            .toSet()
        val userBlocked: Set<UUID> = blockService.blockedCounterpartIds(viewerUuid)

        val excluded: Set<UUID> = buildSet {
            addAll(firstDegree)
            addAll(hidden)
            addAll(recentlyRecommended)
            addAll(adminBlocked)
            addAll(userBlocked)
            add(viewerUuid)
        }

        // 2촌 우선, 부족하면 3촌 보강 (현재 베타 — 3촌 메서드 없으니 secondDegree 만)
        // Phase 3 — friendshipRepository.findThirdDegreeFriendIds 도 추가하면 됨
        val pool: List<UUID> = secondDegree.filter { it !in excluded }

        // 매칭 받기 / 동성 / 프로필 존재 필터
        return pool.mapNotNull { uid ->
            val candidate = userRepository.findById(UserId(uid)) ?: return@mapNotNull null
            val profile = profileRepository.findByUserId(UserId(uid)) ?: return@mapNotNull null
            if (!profile.settings.canReceiveMatches()) return@mapNotNull null
            if (candidate.publicInfo.gender == viewer.publicInfo.gender) return@mapNotNull null
            uid
        }.take(maxSize)
    }

    companion object {
        const val EXCLUSION_DAYS: Long = 60  // ADR 0009
    }
}
