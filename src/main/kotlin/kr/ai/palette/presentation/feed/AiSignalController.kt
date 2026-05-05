package kr.ai.palette.presentation.feed

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.persistence.feed.CardOpenJpaRepository
import kr.ai.palette.persistence.feed.FeedHideJpaRepository
import kr.ai.palette.presentation.profile.ProfileResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.Random
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
) {
    companion object {
        // key: "{userId}:{date}" → 당일 2번째 카드 unlock 여부
        private val unlockedToday = ConcurrentHashMap<String, Boolean>()

        const val UNLOCK_PRICE = 1000  // 원
    }

    @GetMapping
    fun getRecommendations(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<AiSignalResponse> {
        val currentUserId = authUser.userId
        val currentUser = userRepository.findById(currentUserId)
            ?: return ResponseEntity.notFound().build()
        val currentGender = currentUser.publicInfo.gender
        val today = LocalDate.now()

        val firstDegree = friendshipRepository.findFriendIdsByUserId(currentUserId)
            .map { it.value.toString() }.toSet()
        val secondDegree = friendshipRepository.findSecondDegreeFriendIds(currentUserId)
            .map { it.value.toString() }.toSet()
        val hiddenIds = feedHideRepository.findAllByUserId(currentUserId.value.toString())
            .map { it.targetUserId }.toSet()
        val excluded = firstDegree + secondDegree + hiddenIds + currentUserId.value.toString()

        // TODO: Replace with vector-similarity query (pgvector/Pinecone) in Phase 3
        val candidates = profileRepository.findAll().filter { profile ->
            val uid = profile.userId.value.toString()
            if (uid in excluded) return@filter false
            val user = userRepository.findById(profile.userId) ?: return@filter false
            user.publicInfo.gender != currentGender
        }

        if (candidates.isEmpty()) {
            return ResponseEntity.ok(AiSignalResponse(emptyList(), today.toString()))
        }

        val seed = today.toEpochDay() xor currentUserId.value.leastSignificantBits
        val picked = candidates.shuffled(Random(seed)).take(2)

        val unlockKey = "${currentUserId.value}:$today"
        val isSecondUnlocked = unlockedToday[unlockKey] == true

        val recommendations = picked.mapIndexed { index, profile ->
            val isFree = index == 0
            val isUnlocked = isFree || isSecondUnlocked
            val fullProfile = if (isUnlocked) ProfileResponse.from(profile) else null
            val user = userRepository.findById(profile.userId)
            val isOpened = cardOpenJpaRepository.existsByViewerIdAndTargetUserId(
                currentUserId.value, profile.userId.value
            )

            AiSignalRecommendation(
                profile = fullProfile,
                reason = if (isUnlocked) "이상형 소개글 유사도 기반 추천" else "AI가 선택한 오늘의 특별 추천",  // TODO: 실제 reason
                similarityScore = 0.0,  // TODO: 실제 score
                isFree = isFree,
                isUnlocked = isUnlocked,
                unlockPrice = if (isFree) 0 else UNLOCK_PRICE,
                isOpened = isOpened,
                teaserAge = if (!isUnlocked) user?.publicInfo?.birthDate?.let {
                    today.year - it.year
                } else null,
                teaserLocation = if (!isUnlocked) profile.locationInfo?.sido else null
            )
        }

        return ResponseEntity.ok(AiSignalResponse(recommendations, today.toString()))
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
    val generatedAt: String,
    /**
     * TODO: true → 실제 벡터 유사도 미구현 상태. false → 실제 AI 추천
     */
    val isStub: Boolean = true
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
