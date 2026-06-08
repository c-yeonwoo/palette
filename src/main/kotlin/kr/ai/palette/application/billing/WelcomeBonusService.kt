package kr.ai.palette.application.billing

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * 보너스 티켓 지급 정책 SoT — ADR 0041 (체험권/가입 보너스/마일스톤).
 *
 * 정책값은 application.yml 에서 주입 가능 (운영 중 튜닝):
 *  · app.bonus.signup-view-tickets        — 가입 환영 열람 티켓 (기본 3)
 *  · app.bonus.signup-intro-tickets       — 가입 환영 소개 요청 티켓 (기본 1)
 *  · app.bonus.signup-valid-days          — 가입 보너스 유효일 (기본 7)
 *  · app.bonus.friend-signup-view-tickets — 친구 가입 시 양쪽 보상 (기본 1)
 *  · app.bonus.friend-signup-valid-days   — 친구 가입 보너스 유효일 (기본 14)
 */
@Service
@Transactional
class WelcomeBonusService(
    private val billingService: BillingService,
    @Value("\${app.bonus.signup-view-tickets:3}") private val signupViewTickets: Int,
    @Value("\${app.bonus.signup-intro-tickets:1}") private val signupIntroTickets: Int,
    @Value("\${app.bonus.signup-valid-days:7}") private val signupValidDays: Int,
    @Value("\${app.bonus.friend-signup-view-tickets:1}") private val friendSignupViewTickets: Int,
    @Value("\${app.bonus.friend-signup-valid-days:14}") private val friendSignupValidDays: Int,
) {
    private val log = LoggerFactory.getLogger(WelcomeBonusService::class.java)

    /**
     * 가입 직후 1회 호출. 신규 사용자에 7일 무료 체험 지급.
     * 멱등성: 중복 호출 시 잔액 누적 — 호출 측에서 가입 hook 1회만 호출하도록 보장.
     */
    fun grantSignupBonus(userId: String) {
        log.info("가입 환영 보너스 지급 user={} view={} intro={} validDays={}",
            userId, signupViewTickets, signupIntroTickets, signupValidDays)
        billingService.grantBonus(
            userId = userId,
            viewTickets = signupViewTickets,
            introTickets = signupIntroTickets,
            validDays = signupValidDays,
            reason = "signup_welcome",
        )
    }

    /**
     * 친구 수락 시 양쪽에 호출. 친구 1명당 열람권 1장.
     * 어뷰징 가드는 호출 측(FriendshipService)에서 처리.
     */
    fun grantFriendSignupBonus(userId: String) {
        log.info("친구 가입 보너스 user={} view={} validDays={}",
            userId, friendSignupViewTickets, friendSignupValidDays)
        billingService.grantBonus(
            userId = userId,
            viewTickets = friendSignupViewTickets,
            introTickets = 0,
            validDays = friendSignupValidDays,
            reason = "friend_signup",
        )
    }
}
