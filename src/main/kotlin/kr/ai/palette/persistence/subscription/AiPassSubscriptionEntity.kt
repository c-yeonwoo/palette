package kr.ai.palette.persistence.subscription

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * AI 추천 구독 패스 (ADR 0025)
 *
 * 사용자가 "AI 추천 구독 패스"(₩9,900/월)를 활성화하면 1 row.
 * 활성 여부는 expiresAt > now 로 판단. 갱신 시 expiresAt 연장.
 *
 * 결제(Toss) 연동은 Phase 2. 현재는 stub 모드에서 결제 없이 활성화(베타 체험).
 */
@Entity
@Table(
    name = "ai_pass_subscriptions",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id"])]
)
class AiPassSubscriptionEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", columnDefinition = "BINARY(16)", nullable = false)
    val userId: UUID,

    @Column(name = "started_at", nullable = false)
    var startedAt: Instant = Instant.now(),

    @Column(name = "expires_at", nullable = false)
    var expiresAt: Instant,
)
