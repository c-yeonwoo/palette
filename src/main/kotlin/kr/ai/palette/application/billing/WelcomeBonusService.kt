package kr.ai.palette.application.billing

import kr.ai.palette.persistence.subscription.AiPassSubscriptionEntity
import kr.ai.palette.persistence.subscription.AiPassSubscriptionJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * 환영/친구 가입 보너스 정책 SoT — ADR 0042 + ADR 0044 (가격 v2, 60 물감) + ADR 0045 (트라이얼).
 *
 * 정책값은 application.yml 에서 주입 가능 (운영 중 튜닝):
 *  · app.bonus.signup-points         가입 환영 물감 (기본 60, = 6,000원 가치 — 친친 3명 열람)
 *  · app.bonus.signup-valid-days     가입 보너스 유효일 (기본 7)
 *  · app.bonus.friend-signup-points  친구 가입 시 양쪽 보상 물감 (기본 10, = 1,000원)
 *  · app.bonus.friend-signup-valid-days  친구 가입 보너스 유효일 (기본 14)
 *
 * 트라이얼 시스템(ADR 0045)은 별도 sprint에서 wire-up 예정 (열람 3일·반값 묶음·무료 소개·팔레트픽).
 */
@Service
@Transactional
class WelcomeBonusService(
    private val billingService: BillingService,
    private val aiPassRepository: AiPassSubscriptionJpaRepository,
    @Value("\${app.bonus.signup-points:60}") private val signupPoints: Int,
    @Value("\${app.bonus.signup-valid-days:7}") private val signupValidDays: Int,
    @Value("\${app.bonus.friend-signup-points:10}") private val friendSignupPoints: Int,
    @Value("\${app.bonus.friend-signup-valid-days:14}") private val friendSignupValidDays: Int,
) {
    private val log = LoggerFactory.getLogger(WelcomeBonusService::class.java)

    /**
     * 가입 직후 1회 호출. ADR 0044 (60 물감 환영 보너스) + ADR 0045 (트라이얼 4종).
     *
     *  1) 60 물감 보너스 적립 (7일 만료)
     *  2) 트라이얼 초기화 (열람 3일·반값 묶음·무료 소개·팔레트픽 첫달)
     *
     * 멱등성: 호출 측이 가입 hook 1회만 호출하도록 보장.
     */
    fun grantSignupBonus(userId: String) {
        log.info("가입 환영 보너스 user={} +{}P validDays={}", userId, signupPoints, signupValidDays)
        billingService.grantBonus(
            userId = userId,
            points = signupPoints,
            validDays = signupValidDays,
            reason = "signup_welcome",
        )
        // 트라이얼 시스템 초기화 (ADR 0045)
        billingService.initializeTrial(userId)

        // 팔레트픽 첫 달 무료 — 30일 trial AiPassSubscription 자동 생성 (ADR 0045)
        // 계정당 1회 (UNIQUE user_id) — 재가입 시 이미 행 있으면 스킵
        val userUuid = try { UUID.fromString(userId) } catch (e: Exception) { return }
        if (aiPassRepository.findByUserId(userUuid) == null) {
            val now = Instant.now()
            aiPassRepository.save(
                AiPassSubscriptionEntity(
                    userId = userUuid,
                    startedAt = now,
                    expiresAt = now.plusSeconds(30L * 86_400),  // 30일
                )
            )
            log.info("팔레트픽 첫 달 무료 trial 활성 user={}", userId)
        }
    }

    /**
     * 친구 수락 시 양쪽에 호출. 친구 1명당 100P.
     * 어뷰징 가드는 호출 측(FriendshipService)에서 처리.
     */
    fun grantFriendSignupBonus(userId: String) {
        log.info("친구 가입 보너스 user={} +{}P validDays={}", userId, friendSignupPoints, friendSignupValidDays)
        billingService.grantBonus(
            userId = userId,
            points = friendSignupPoints,
            validDays = friendSignupValidDays,
            reason = "friend_signup",
        )
    }
}
