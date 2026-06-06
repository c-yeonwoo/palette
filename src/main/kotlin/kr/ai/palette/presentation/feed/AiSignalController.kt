package kr.ai.palette.presentation.feed

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.seed.SeedUserPolicy
import kr.ai.palette.infrastructure.storage.FileStorageService
import kr.ai.palette.persistence.feed.CardOpenJpaRepository
import kr.ai.palette.persistence.feed.FeedHideJpaRepository
import kr.ai.palette.persistence.recommendation.AdminBlockedTargetJpaRepository
import kr.ai.palette.persistence.recommendation.DailyRecommendationEntity
import kr.ai.palette.persistence.recommendation.DailyRecommendationJpaRepository
import kr.ai.palette.persistence.recommendation.RecommendationSourceEntity
import kr.ai.palette.presentation.profile.ProfileResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Random
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * AI 시그널 추천 컨트롤러
 *
 * - 하루 1장 무료, 2번째는 1,000원 과금 후 열람
 * - TODO: 벡터 DB 기반 유사도 매칭 구현 예정
 *   - 프로필 소개글(introduction.text) + 이상형 설명을 임베딩 벡터로 변환
 *   - pgvector / Pinecone 등 벡터 DB에 저장
 *   - 코사인 유사도 기반 상위 N명 추천
 *   - 현재는 날짜+userId 시드 기반 랜덤 1~2명 반환 (인터페이스만 완성)
 */
@RestController
@RequestMapping("/api/v1/feed/ai-signal")
class AiSignalController(
    private val profileRepository: ProfileRepository,
    private val userRepository: UserRepository,
    private val friendshipRepository: FriendshipRepository,
    private val cardOpenJpaRepository: CardOpenJpaRepository,
    private val feedHideRepository: FeedHideJpaRepository,
    private val fileStorageService: FileStorageService,
    private val seedUserPolicy: SeedUserPolicy,
    private val dailyRecommendationRepo: DailyRecommendationJpaRepository,
    private val adminBlockedTargetRepo: AdminBlockedTargetJpaRepository,
) {
    companion object {
        // key: "{userId}:{date}" → 당일 2번째 카드 unlock 여부
        private val unlockedToday = ConcurrentHashMap<String, Boolean>()

        const val UNLOCK_PRICE = 1000  // 원

        /** 60일 이내 추천된 적 있는 사용자는 후보에서 제외 (ADR 0009) */
        const val RECOMMENDATION_EXCLUSION_DAYS = 60L

        private val KST = ZoneId.of("Asia/Seoul")
    }

    @GetMapping
    @Transactional
    fun getRecommendations(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<AiSignalResponse> {
        val currentUserId = authUser.userId
        val currentUser = userRepository.findById(currentUserId)
            ?: return ResponseEntity.notFound().build()
        val today = LocalDate.now(KST)

        // 1) 이미 오늘 저장된 추천이 있으면 그대로 반환 (결정성 + 저장된 source = AUTO/ADMIN_PIN/ADMIN_REPLACE 보존)
        val saved = dailyRecommendationRepo
            .findByViewerUserIdAndRecommendedDateOrderByPositionAsc(currentUserId.value, today)
        if (saved.isNotEmpty()) {
            return ResponseEntity.ok(buildResponse(currentUserId, today, saved.map { it.targetUserId }))
        }

        // 2) 없으면 후보 계산 + 저장 (write-through)
        val picked = computeNewRecommendations(currentUserId, currentUser, today)
        if (picked.isEmpty()) {
            return ResponseEntity.ok(AiSignalResponse(emptyList(), today.toString()))
        }

        // 영속화 — position 1, 2 ...
        picked.forEachIndexed { idx, targetUserId ->
            dailyRecommendationRepo.save(
                DailyRecommendationEntity(
                    viewerUserId = currentUserId.value,
                    targetUserId = targetUserId,
                    recommendedDate = today,
                    position = idx + 1,
                    source = RecommendationSourceEntity.AUTO,
                    createdAt = Instant.now(),
                )
            )
        }

        return ResponseEntity.ok(buildResponse(currentUserId, today, picked))
    }

    /** 후보 계산 — 시드 격리 + 친구/매칭 제외 + 60일 추천 이력 제외 */
    private fun computeNewRecommendations(
        currentUserId: kr.ai.palette.domain.common.UserId,
        currentUser: kr.ai.palette.domain.user.User,
        today: LocalDate,
    ): List<UUID> {
        val firstDegree = friendshipRepository.findFriendIdsByUserId(currentUserId)
            .map { it.value.toString() }.toSet()
        val secondDegree = friendshipRepository.findSecondDegreeFriendIds(currentUserId)
            .map { it.value.toString() }.toSet()
        val hiddenIds = feedHideRepository.findAllByUserId(currentUserId.value.toString())
            .map { it.targetUserId }.toSet()
        val excluded = firstDegree + secondDegree + hiddenIds + currentUserId.value.toString()

        val exposeSeed = seedUserPolicy.shouldExposeSeedTo(currentUser)

        // 신규 가입자(친구 0 + 비시드)는 깨끗한 시작
        if (!exposeSeed && firstDegree.isEmpty()) return emptyList()

        // 60일 이내 추천된 적 있는 target 제외 — ADR 0009
        val since = today.minusDays(RECOMMENDATION_EXCLUSION_DAYS)
        val recentlyRecommended = dailyRecommendationRepo
            .findRecentlyRecommendedTargetIds(currentUserId.value, since)
            .toSet()

        // 운영자 차단 target 제외 — ADR 0011
        val blockedTargets = adminBlockedTargetRepo
            .findActiveBlockedTargetIds(currentUserId.value, today)
            .toSet()

        val currentGender = currentUser.publicInfo.gender

        // TODO: vector-similarity (Phase 3). 현재는 date+UID seed 랜덤.
        val candidates = profileRepository.findAll().filter { profile ->
            val uid = profile.userId.value
            if (uid.toString() in excluded) return@filter false
            if (uid in recentlyRecommended) return@filter false
            if (uid in blockedTargets) return@filter false
            if (!profile.settings.canReceiveMatches()) return@filter false  // 소개/주선 받기 off·숨김 제외 (ADR 0022)
            val user = userRepository.findById(profile.userId) ?: return@filter false
            if (!exposeSeed && seedUserPolicy.isSeed(user)) return@filter false
            user.publicInfo.gender != currentGender
        }
        if (candidates.isEmpty()) return emptyList()

        val seed = today.toEpochDay() xor currentUserId.value.leastSignificantBits
        return candidates.shuffled(Random(seed)).take(2).map { it.userId.value }
    }

    /** 저장된 또는 방금 계산한 target UUID 목록 → 응답 DTO */
    private fun buildResponse(
        viewerId: kr.ai.palette.domain.common.UserId,
        today: LocalDate,
        targetIds: List<UUID>,
    ): AiSignalResponse {
        val unlockKey = "${viewerId.value}:$today"
        val isSecondUnlocked = unlockedToday[unlockKey] == true

        val recommendations = targetIds.mapIndexedNotNull { index, targetUserId ->
            val profile = profileRepository.findByUserId(kr.ai.palette.domain.common.UserId(targetUserId))
                ?: return@mapIndexedNotNull null
            val user = userRepository.findById(profile.userId)
            val isFree = index == 0
            val isUnlocked = isFree || isSecondUnlocked
            val fullProfile = if (isUnlocked) ProfileResponse.from(profile, fileStorageService) else null
            val isOpened = cardOpenJpaRepository.existsByViewerIdAndTargetUserId(viewerId.value, targetUserId)

            AiSignalRecommendation(
                profile = fullProfile,
                reason = if (isUnlocked) "이상형 소개글 유사도 기반 추천" else "AI가 선택한 오늘의 특별 추천",
                similarityScore = 0.0,
                isFree = isFree,
                isUnlocked = isUnlocked,
                unlockPrice = if (isFree) 0 else UNLOCK_PRICE,
                isOpened = isOpened,
                teaserAge = if (!isUnlocked) user?.publicInfo?.birthDate?.let { today.year - it.year } else null,
                teaserLocation = if (!isUnlocked) profile.locationInfo?.sido else null,
            )
        }

        return AiSignalResponse(recommendations, today.toString())
    }

    /**
     * 2번째 AI 추천 카드 열람 (1,000원 과금)
     *
     * MVP: paymentKey를 요청 바디에 포함해야 합니다.
     * 결제 검증이 완료되기 전까지는 unlock을 허용하지 않습니다.
     *
     * TODO Phase 2: Toss Payments 결제 검증 연동 후 실제 과금 처리
     */
    @PostMapping("/unlock")
    fun unlockSecondRecommendation(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody(required = false) body: UnlockRequestBody?
    ): ResponseEntity<UnlockResponse> {
        val today = LocalDate.now()
        val unlockKey = "${authUser.userId.value}:$today"

        if (unlockedToday[unlockKey] == true) {
            return ResponseEntity.ok(UnlockResponse(alreadyUnlocked = true, price = 0))
        }

        // 결제 키 검증 (MVP: paymentKey 필수)
        if (body?.paymentKey.isNullOrBlank()) {
            return ResponseEntity.status(402).build()
        }

        // TODO Phase 2: Toss Payments /v1/payments/confirm API 호출하여 paymentKey 검증
        // 현재는 paymentKey 존재 여부만 체크 (사전 검증 없음)
        unlockedToday[unlockKey] = true

        return ResponseEntity.ok(UnlockResponse(alreadyUnlocked = false, price = UNLOCK_PRICE))
    }
}

data class AiSignalResponse(
    val recommendations: List<AiSignalRecommendation>,
    val generatedAt: String
)

data class AiSignalRecommendation(
    val profile: ProfileResponse?,       // 잠금 상태면 null
    val reason: String,
    val similarityScore: Double,
    val isFree: Boolean,                 // 첫 번째 카드 (무료)
    val isUnlocked: Boolean,             // 결제 후 열람 완료 여부
    val unlockPrice: Int,                // 과금 금액 (원), 무료면 0
    val isOpened: Boolean = false,       // 카드를 열어본 여부 (물감 제거 여부)
    val teaserAge: Int? = null,          // 잠금 상태일 때 노출할 나이 티저
    val teaserLocation: String? = null   // 잠금 상태일 때 노출할 지역 티저
)

data class UnlockResponse(
    val alreadyUnlocked: Boolean,
    val price: Int
)

data class UnlockRequestBody(
    /** Toss Payments paymentKey from front-end payment approval response */
    val paymentKey: String?
)
