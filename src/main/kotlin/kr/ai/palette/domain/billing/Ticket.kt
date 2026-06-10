package kr.ai.palette.domain.billing

/**
 * 결제 모델 SoT — ADR 0042 (단일 잔액 모델) + ADR 0044 (가격 v2).
 *
 * **단위**: 사용자 노출 "물감" (Paint). `1 물감 = 100원 (KRW)`.
 * 코드 내부 변수명은 `point` / `P` 유지 — UI 라벨만 "물감"으로.
 *
 * 사용자 결제 3축:
 *  1) 잔액 (물감) — 모든 사용처 공통 차감 단위
 *  2) 성의 표시 (팁) — 잔액에서 자유 금액 송금, 주선자 90 / 플랫폼 10 분배 (ADR 0044)
 *  3) 팔레트 Pick 패스 — 월 구독 29,900원 (`AiPassSubscription` 별도). 첫 달 무료 (ADR 0045)
 *
 * 베타: 결제 미연동 — 충전은 stub. 정식: Toss confirm → 잔액 적립.
 */

/** 사용처별 차감 가격 (물감 단위). ADR 0044 (가격 v2). */
object PointPrice {
    /** 1촌 친구 본인 프로필 열람 — 무료 */
    const val FRIEND_VIEW: Int = 0

    /** 친구의 친구(2촌) 프로필 열람 — "커피 한잔값" (ADR 0044) */
    const val FRIEND_OF_FRIEND_VIEW: Int = 20    // = 2,000원

    /** 한 다리 더 건너(3촌) 프로필 열람 — 셀프 풀 확장 인센티브 (ADR 0044) */
    const val FURTHER_VIEW: Int = 30             // = 3,000원

    /** 소개 요청 1회 — 매칭 시도 진입권 (ADR 0044, 분배: 주선자 Lv별 15~40% / 플랫폼 60~85%) */
    const val INTRO_REQUEST: Int = 100           // = 10,000원

    /** 팁 최소 (자유 금액 안에서). ADR 0044. */
    const val TIP_MIN: Int = 10                  // = 1,000원

    /** 팁 최대. ADR 0044 — 큰 감사 표현 + 외부 송금 유혹 ↓. */
    const val TIP_MAX: Int = 500                 // = 50,000원

    /** 1 물감 원화 환산 (회계·출금 용도) */
    const val WON_PER_POINT: Int = 100
}

/**
 * 팁 분배 정책 (ADR 0044 §3).
 *
 * 사용자가 보낸 팁 amount 중:
 *   - 주선자: amount × MATCHMAKER_SHARE (= 90%) → paidPoints (출금 가능)
 *   - 플랫폼: amount × PLATFORM_FEE (= 10%) → 수수료 매출 (감사 로그)
 */
object TipDistribution {
    const val MATCHMAKER_SHARE: Double = 0.9
    const val PLATFORM_FEE: Double = 0.1

    /** 받는 사람에게 적립되는 물감 (소수점 버림 → 사용자에게 유리). */
    fun matchmakerShare(amountPoints: Int): Int = (amountPoints * MATCHMAKER_SHARE).toInt()

    /** 플랫폼 수수료 물감 (나머지). amountPoints - matchmakerShare 로 정합성 보장. */
    fun platformFee(amountPoints: Int): Int = amountPoints - matchmakerShare(amountPoints)
}

/**
 * 충전 묶음. ADR 0042 + ADR 0044.
 * `priceWon` = 사용자가 결제하는 원화, `pointsCredited` = 잔액에 적립되는 물감.
 */
data class PointBundle(
    val pointsCredited: Int,
    val priceWon: Int,
) {
    /** 정가 대비 단가 절감률 (%). 보너스 없으면 0. */
    fun bonusPercent(): Int {
        val basePrice = pointsCredited * PointPrice.WON_PER_POINT
        return if (basePrice <= priceWon) 0
        else ((basePrice - priceWon) * 100 / basePrice)
    }
}

object PointBundleCatalog {
    val BUNDLES: List<PointBundle> = listOf(
        PointBundle(pointsCredited = 50,  priceWon = 5_000),    // 정가
        PointBundle(pointsCredited = 110, priceWon = 10_000),   // +10 물감 (10%) — 트라이얼 반값 대상 (ADR 0045)
        PointBundle(pointsCredited = 340, priceWon = 30_000),   // +40 물감 (13%)
        PointBundle(pointsCredited = 575, priceWon = 50_000),   // +75 물감 (15%)
    )

    /** 트라이얼 반값 대상 묶음 식별자 (ADR 0045 §2). pointsCredited 로 매칭. */
    const val TRIAL_HALF_PRICE_BUNDLE_POINTS: Int = 110
}
