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
import kr.ai.palette.persistence.subscription.AiPassSubscriptionEntity
import kr.ai.palette.persistence.subscription.AiPassSubscriptionJpaRepository
import kr.ai.palette.presentation.profile.ProfileResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * AI 시그널 추천 컨트롤러 — "오늘의 추천" (ADR 0025)
 *
 * - 비구독자: 하루 1장 무료 미리보기, 2번째부터는 "AI 추천 구독 패스"(₩9,900/월) 필요
 * - 구독자: 매일 추천 무제한 열람 + 궁합 리포트
 * - 결제(Toss) 미연동 — stub 모드에서는 결제 없이 패스 활성화(베타 체험)
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
    private val blockService: kr.ai.palette.application.safety.BlockService,
    private val aiPassRepo: AiPassSubscriptionJpaRepository,
    private val palettePickRecommendationService: kr.ai.palette.palettepick.application.PalettePickRecommendationService,
    @Value("\${toss.payments.secret-key:}") private val paymentSecretKey: String,
) {
    companion object {
        // key: "{userId}:{date}" → 당일 2번째 카드 unlock 여부 (legacy per-card unlock)
        private val unlockedToday = ConcurrentHashMap<String, Boolean>()

        const val UNLOCK_PRICE = 1000  // 원 (legacy)

        /** AI 추천 구독 패스 (ADR 0025 → ADR 0044 가격 v2 — 29,900원/월) */
        const val PASS_PRICE_MONTHLY = 29900  // 원/월 (ADR 0044)
        const val PASS_DURATION_DAYS = 30L

        /** 60일 이내 추천된 적 있는 사용자는 후보에서 제외 (ADR 0009) */
        const val RECOMMENDATION_EXCLUSION_DAYS = 60L

        private val KST = ZoneId.of("Asia/Seoul")
    }

    /** Toss secret 키가 없거나 placeholder 면 결제 stub 모드 (OpenAIService.isStubMode 패턴) */
    private val isPaymentStubMode: Boolean
        get() = paymentSecretKey.isBlank() || paymentSecretKey.startsWith("dummy") || paymentSecretKey.contains("placeholder")

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

    /**
     * 후보 계산 — PalettePickRecommendationService 위임 (ADR 0047 §B).
     *
     * 시드 사용자 정책만 컨트롤러 단에서 우선 처리하고, 나머지(친구망/차단/숨김/60일/이상형/색/모멘텀)
     * 는 오케스트레이터가 수행. 베타 단계 — 신규 가입자(친구 0 + 비시드)는 깨끗한 시작.
     */
    private fun computeNewRecommendations(
        currentUserId: kr.ai.palette.domain.common.UserId,
        currentUser: kr.ai.palette.domain.user.User,
        today: LocalDate,
    ): List<UUID> {
        val firstDegree = friendshipRepository.findFriendIdsByUserId(currentUserId)
        val exposeSeed = seedUserPolicy.shouldExposeSeedTo(currentUser)
        if (!exposeSeed && firstDegree.isEmpty()) return emptyList()
        return palettePickRecommendationService.recommend(currentUser, today, topK = 2)
    }

    /** 저장된 또는 방금 계산한 target UUID 목록 → 응답 DTO */
    private fun buildResponse(
        viewerId: kr.ai.palette.domain.common.UserId,
        today: LocalDate,
        targetIds: List<UUID>,
    ): AiSignalResponse {
        val unlockKey = "${viewerId.value}:$today"
        val isSecondUnlocked = unlockedToday[unlockKey] == true
        val pass = aiPassRepo.findByUserId(viewerId.value)
        val isSubscriber = pass?.expiresAt?.isAfter(Instant.now()) == true

        val recommendations = targetIds.mapIndexedNotNull { index, targetUserId ->
            val profile = profileRepository.findByUserId(kr.ai.palette.domain.common.UserId(targetUserId))
                ?: return@mapIndexedNotNull null
            val user = userRepository.findById(profile.userId)
            val isFree = index == 0
            // 무료 1장 OR 구독자 OR (legacy) 당일 결제 → 열람 가능
            val isUnlocked = isFree || isSubscriber || isSecondUnlocked
            val fullProfile = if (isUnlocked) ProfileResponse.from(profile, fileStorageService) else null
            val isOpened = cardOpenJpaRepository.existsByViewerIdAndTargetUserId(viewerId.value, targetUserId)

            AiSignalRecommendation(
                profile = fullProfile,
                reason = if (isUnlocked) "프로필 궁합도 기반 추천" else "구독하면 만날 수 있는 오늘의 추천",
                similarityScore = 0.0,
                isFree = isFree,
                isUnlocked = isUnlocked,
                requiresPass = !isUnlocked,
                unlockPrice = if (isFree) 0 else UNLOCK_PRICE,
                isOpened = isOpened,
                teaserAge = if (!isUnlocked) user?.publicInfo?.birthDate?.let { today.year - it.year } else null,
                teaserLocation = if (!isUnlocked) profile.locationInfo?.sido else null,
                // 잠긴 카드도 색 타입은 노출 → 프론트가 궁합 % 티저 계산 (matrix는 프론트 단일 소스)
                teaserColorType = profile.colorType?.type?.name,
            )
        }

        return AiSignalResponse(
            recommendations = recommendations,
            generatedAt = today.toString(),
            isSubscriber = isSubscriber,
            passPriceMonthly = PASS_PRICE_MONTHLY,
            passExpiresAt = if (isSubscriber) pass?.expiresAt?.toString() else null,
        )
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

    /**
     * AI 추천 구독 패스 구독/갱신 (ADR 0025)
     *
     * - stub 모드(결제 미연동): paymentKey 없이 30일 패스 활성화(베타 체험)
     * - 실 결제 모드: paymentKey 필수 — Toss 검증 연동 전까지 402 반환
     */
    @PostMapping("/subscribe")
    @Transactional
    fun subscribe(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody(required = false) body: UnlockRequestBody?
    ): ResponseEntity<SubscribeResponse> {
        // 실 결제 모드인데 paymentKey 없으면 결제 필요
        if (!isPaymentStubMode && body?.paymentKey.isNullOrBlank()) {
            return ResponseEntity.status(402).build()
        }
        // TODO Phase 2: Toss Payments 정기결제(빌링) 검증 후 활성화

        val userId = authUser.userId.value
        val now = Instant.now()
        val existing = aiPassRepo.findByUserId(userId)
        val newExpiry = (existing?.expiresAt?.takeIf { it.isAfter(now) } ?: now)
            .plus(java.time.Duration.ofDays(PASS_DURATION_DAYS))

        if (existing != null) {
            existing.expiresAt = newExpiry
            aiPassRepo.save(existing)
        } else {
            aiPassRepo.save(
                AiPassSubscriptionEntity(userId = userId, startedAt = now, expiresAt = newExpiry)
            )
        }

        return ResponseEntity.ok(
            SubscribeResponse(active = true, expiresAt = newExpiry.toString(), priceMonthly = PASS_PRICE_MONTHLY)
        )
    }
}

data class AiSignalResponse(
    val recommendations: List<AiSignalRecommendation>,
    val generatedAt: String,
    val isSubscriber: Boolean = false,       // AI 추천 구독 패스 보유 여부
    val passPriceMonthly: Int = PASS_PRICE_MONTHLY_DEFAULT,  // 구독 가격 (원/월)
    val passExpiresAt: String? = null,       // 구독 만료일 (구독자만)
) {
    companion object {
        const val PASS_PRICE_MONTHLY_DEFAULT = 9900
    }
}

data class AiSignalRecommendation(
    val profile: ProfileResponse?,       // 잠금 상태면 null
    val reason: String,
    val similarityScore: Double,
    val isFree: Boolean,                 // @deprecated ADR 0025 시절 무료 1장 모델. ADR 0044/0045 부터 계정당 첫 달 통째 무료(AiPassSubscription TRIAL)로 대체. 클라이언트 미사용. 다음 sweep 시 제거.
    val isUnlocked: Boolean,             // 열람 가능 여부 (무료/구독/legacy 결제)
    val requiresPass: Boolean = false,   // 구독 패스가 있어야 열리는 카드
    val unlockPrice: Int,                // (legacy) 과금 금액 (원), 무료면 0
    val isOpened: Boolean = false,       // 카드를 열어본 여부 (물감 제거 여부)
    val teaserAge: Int? = null,          // 잠금 상태일 때 노출할 나이 티저
    val teaserLocation: String? = null,  // 잠금 상태일 때 노출할 지역 티저
    val teaserColorType: String? = null  // 잠금 상태일 때도 색 타입은 노출 → 궁합 % 티저
)

data class UnlockResponse(
    val alreadyUnlocked: Boolean,
    val price: Int
)

data class SubscribeResponse(
    val active: Boolean,
    val expiresAt: String,
    val priceMonthly: Int
)

data class UnlockRequestBody(
    /** Toss Payments paymentKey from front-end payment approval response */
    val paymentKey: String?
)
