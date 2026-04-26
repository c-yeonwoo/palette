package kr.ai.palette.persistence.payment

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "payment_transactions")
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

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
)
