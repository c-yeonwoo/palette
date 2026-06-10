package kr.ai.palette.persistence.billing

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * 어드민 수동 충전 audit log. ADR 0044 (가격 v2) + 운영 감사.
 *
 * 운영자가 사용자에게 물감을 직접 지급한 이력 — CS 응대, 보상, 사과,
 * 이벤트 등 모든 수동 적립 케이스를 추적·감사 가능하게 영속화.
 *
 * type:
 *  · BONUS — bonusPoints 로 적립 (만료 가능, 출금 X). 보상·이벤트성
 *  · PAID  — paidPoints 로 적립 (만료 X, 출금 가능). 결제 보정·환불 등 정상 적립
 *
 * 모든 수동 충전은 BillingService 의 grantBonus / creditPaidPoints 를 호출해
 * 실제 잔액을 갱신하며, 동시에 본 entity 로 누가/언제/얼마/왜 를 기록.
 */
@Entity
@Table(
    name = "admin_billing_grants",
    indexes = [
        Index(name = "idx_admin_billing_recipient", columnList = "recipient_user_id"),
        Index(name = "idx_admin_billing_granted_at", columnList = "granted_at"),
    ],
)
class AdminBillingGrantEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    /** 충전 받은 사용자 */
    @Column(name = "recipient_user_id", nullable = false)
    val recipientUserId: String,

    /** 충전 실행한 운영자 (admin 사용자 ID) */
    @Column(name = "granter_admin_user_id", nullable = false)
    val granterAdminUserId: String,

    /** 적립 물감 수 (양수) */
    @Column(name = "amount_points", nullable = false)
    val amountPoints: Int,

    /** BONUS / PAID — 적립 종류 */
    @Column(name = "grant_type", nullable = false, length = 16)
    val grantType: String,

    /** 보너스인 경우 유효기간(일). null = 무기한. PAID 면 무시. */
    @Column(name = "valid_days")
    val validDays: Int? = null,

    /** 수동 충전 사유 (운영자 입력 — 필수) */
    @Column(name = "reason", nullable = false, length = 200)
    val reason: String,

    @Column(name = "granted_at", nullable = false, updatable = false)
    val grantedAt: Instant = Instant.now(),
)
