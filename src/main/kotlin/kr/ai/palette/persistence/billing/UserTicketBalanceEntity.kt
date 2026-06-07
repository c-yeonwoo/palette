package kr.ai.palette.persistence.billing

import jakarta.persistence.*
import java.time.Instant

/**
 * 사용자별 티켓 잔액 (프로필 열람 + 소개 요청). ADR 0039.
 *
 * 단일 row per user — 두 종류 티켓 잔액을 한 곳에서 관리 (조회 1회로 충분).
 * row 미존재 시 0/0 으로 간주(BillingService 가 lazy 생성).
 */
@Entity
@Table(name = "user_ticket_balances")
class UserTicketBalanceEntity(
    @Id
    @Column(name = "user_id", nullable = false)
    val userId: String,

    @Column(name = "view_ticket_count", nullable = false)
    var viewTicketCount: Int = 0,

    @Column(name = "intro_request_ticket_count", nullable = false)
    var introRequestTicketCount: Int = 0,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
