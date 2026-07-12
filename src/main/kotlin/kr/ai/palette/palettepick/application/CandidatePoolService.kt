package kr.ai.palette.palettepick.application

import kr.ai.palette.application.safety.BlockService
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.geo.SigunguGeo
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.User
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.seed.SeedUserPolicy
import kr.ai.palette.persistence.feed.FeedHideJpaRepository
import kr.ai.palette.persistence.profile.ProfileJpaRepository
import kr.ai.palette.persistence.recommendation.AdminBlockedTargetJpaRepository
import kr.ai.palette.persistence.recommendation.DailyRecommendationJpaRepository
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.UUID

/** 후보 출처 (ADR 0072). */
enum class CandidateSource { ACQUAINTANCE, PUBLIC }

/** 후보 + 출처 + (공개 풀일 때) 거리 km. */
data class PoolCandidate(
    val userId: UUID,
    val source: CandidateSource,
    val distanceKm: Double? = null,
)

/**
 * 팔레트픽 후보 풀 (ADR 0047 §B.3 Stage 1 + ADR 0072 콜드스타트 폴백).
 *
 * 2단 구조:
 *  1. **지인 티어** — 2촌 풀(신뢰 우선). 항상 앞 순위.
 *  2. **공개 발견 폴백** — 지인 티어가 MIN_ACQUAINTANCE_POOL 미만이면 수도권 공개 풀
 *     (publicDiscoverable + 매칭받기 on + 숨김 아님 + 이성 + 활성)로 보강, **거리순**.
 *     친구 0명(콜드스타트)이어도 실제 프로필을 채운다 — 프론트 데모 12명 하드코딩 대체.
 *
 * 공통 필터: 1촌 제외 · 자신/차단(유저·운영자)/숨김/60일 이력 제외 · 이성 · 매칭받기 on.
 * 반환 ≤ maxSize.
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
    private val profileJpaRepository: ProfileJpaRepository,
    private val seedUserPolicy: SeedUserPolicy,
) {

    /**
     * 후보 풀 (UUID 목록). 지인 우선 → 공개 폴백(거리순). 하위호환 시그니처.
     */
    fun build(viewer: User, today: LocalDate = LocalDate.now(), maxSize: Int = 50): List<UUID> =
        buildWithMeta(viewer, today, maxSize).map { it.userId }

    /**
     * 후보 풀 + 출처/거리 메타 (ADR 0072). 추천 응답 태깅용.
     */
    fun buildWithMeta(viewer: User, today: LocalDate = LocalDate.now(), maxSize: Int = 50): List<PoolCandidate> {
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

        // 시드 격리 (ADR 0003) — 비시드 viewer 에겐 데모/시드 계정을 후보에서 제외.
        // (컨트롤러의 친구 0명 early-return 을 걷어냈으므로 여기서 강제 — ADR 0072.)
        val viewerIsSeed = seedUserPolicy.isSeed(viewer)

        // ── 지인 티어 (2촌) ──
        val acquaintance: List<PoolCandidate> = secondDegree
            .filter { it !in excluded }
            .mapNotNull { uid -> if (isValidMatch(uid, viewer, viewerIsSeed)) PoolCandidate(uid, CandidateSource.ACQUAINTANCE) else null }
            .take(maxSize)

        // 지인 풀이 충분하면 공개 폴백 없이 반환 (신뢰 우선)
        if (acquaintance.size >= maxSize || acquaintance.size >= MIN_ACQUAINTANCE_POOL) {
            return acquaintance
        }

        // ── 공개 발견 폴백 (수도권, 거리순) ──
        val need = maxSize - acquaintance.size
        val acquaintanceIds: Set<UUID> = acquaintance.mapTo(mutableSetOf()) { it.userId }
        val viewerProfile = profileRepository.findByUserId(viewerId)
        val vSido = viewerProfile?.locationInfo?.sido
        val vSigungu = viewerProfile?.locationInfo?.sigungu

        val publicSorted = profileJpaRepository
            .findPublicPoolCandidates(SigunguGeo.CAPITAL_AREA_SIDO)
            .asSequence()
            .filter { it.userId != viewerUuid && it.userId !in excluded && it.userId !in acquaintanceIds }
            .map { row -> row to SigunguGeo.distanceKm(vSido, vSigungu, row.sido, row.sigungu) }
            .sortedBy { it.second ?: Double.MAX_VALUE }  // 좌표 없으면 후순위

        val public = mutableListOf<PoolCandidate>()
        for ((row, dist) in publicSorted) {
            if (public.size >= need) break
            val candidate = userRepository.findById(UserId(row.userId)) ?: continue
            if (!candidate.isActive()) continue
            if (!viewerIsSeed && seedUserPolicy.isSeed(candidate)) continue  // 시드 격리 (ADR 0003)
            if (candidate.publicInfo.gender == viewer.publicInfo.gender) continue
            public += PoolCandidate(row.userId, CandidateSource.PUBLIC, dist)
        }

        return acquaintance + public
    }

    /** 지인 후보 유효성 — 유저·프로필 존재 + 매칭받기 on + 이성 + 시드 격리. */
    private fun isValidMatch(uid: UUID, viewer: User, viewerIsSeed: Boolean): Boolean {
        val candidate = userRepository.findById(UserId(uid)) ?: return false
        val profile = profileRepository.findByUserId(UserId(uid)) ?: return false
        if (!profile.settings.canReceiveMatches()) return false
        if (!viewerIsSeed && seedUserPolicy.isSeed(candidate)) return false  // 시드 격리 (ADR 0003)
        if (candidate.publicInfo.gender == viewer.publicInfo.gender) return false
        return true
    }

    companion object {
        const val EXCLUSION_DAYS: Long = 60  // ADR 0009
        const val MIN_ACQUAINTANCE_POOL: Int = 5  // 이 미만이면 공개 풀 보강 (ADR 0072)
    }
}
