package kr.ai.palette.persistence.payment

import jakarta.persistence.*
import java.time.Instant

/**
 * 결제 트랜잭션 — Toss / Apple IAP / Google Play Billing 공통 영수증 기록. PA-001.
 *
 * **멱등성**:
 *  · `id` PK 자체가 UNIQUE — 호출 측이 동일 transactionId 로 save 시 자연 차단.
 *  · `(provider, providerReceiptId)` UNIQUE INDEX — 외부 영수증 한 번만 처리
 *    (Toss paymentKey · Apple originalTransactionId · Google purchaseToken).
 *
 * 베타: provider="MOCK" / status="APPROVED" 로 stub 운영.
 * 정식: PA-002/003/004 통합 후 Toss/Apple/Google 영수증 검증 결과 저장.
 */
@Entity
@Table(
    name = "payment_transactions",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uq_payment_provider_receipt",
            columnNames = ["provider", "provider_receipt_id"],
        ),
    ],
    indexes = [
        Index(name = "idx_payment_buyer", columnList = "buyer_user_id"),
    ],
)
class PaymentTransactionEntity(
    @Id
    val id: String,

    @Column(name = "buyer_user_id", nullable = false)
    val buyerUserId: String,

    @Column(name = "target_user_id", nullable = false)
    val targetUserId: String,

    @Column(nullable = false)
    val amount: Int,

    @Column(name = "payment_method", nullable = false)
    val paymentMethod: String,

    /**
     * 결제 채널 — TOSS / APPLE_IAP / GOOGLE_PLAY / MOCK (베타).
     * columnDefinition DEFAULT 로 기존 row(MOCK) 자동 채움 — ddl-auto=update 시 NOT NULL 추가 가능.
     */
    @Column(name = "provider", nullable = false, length = 16, columnDefinition = "VARCHAR(16) DEFAULT 'MOCK'")
    val provider: String = "MOCK",

    /** 외부 시스템 영수증 ID — Toss paymentKey / Apple originalTransactionId / Google purchaseToken */
    @Column(name = "provider_receipt_id", length = 200)
    val providerReceiptId: String? = null,

    /** APPROVED / REFUNDED / FAILED */
    @Column(name = "status", nullable = false, length = 16, columnDefinition = "VARCHAR(16) DEFAULT 'APPROVED'")
    var status: String = "APPROVED",

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "refunded_at")
    var refundedAt: Instant? = null,
)
