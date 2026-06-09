package kr.ai.palette.domain.billing

/**
 * 결제 모델 SoT — ADR 0042 (단일 잔액 모델, 1P = 10원).
 *
 * 사용자 결제는 3축:
 *  1) 잔액 (P) — 모든 사용처 공통 차감 단위
 *  2) 성의 표시 — 잔액에서 자유 금액 송금 (옵셔널 tip)
 *  3) 팔레트 Pick 패스 — 월 구독 (`AiPassSubscription` 별도)
 *
 * 베타: 결제 미연동 — 충전은 stub. 정식: Toss confirm → 잔액 적립.
 */

/** 사용처별 차감 가격 (P 단위). */
object PointPrice {
    /** 1촌 친구 본인 프로필 열람 — 무료 */
    const val FRIEND_VIEW: Int = 0

    /** 친구의 친구(2촌) 프로필 열람 */
    const val FRIEND_OF_FRIEND_VIEW: Int = 100   // = 1,000원

    /** 한 다리 더 건너 (3촌) 프로필 열람 */
    const val FURTHER_VIEW: Int = 200            // = 2,000원

    /** 소개 요청 1회 */
    const val INTRO_REQUEST: Int = 300           // = 3,000원

    /** 팁 최소/최대 (자유 금액 안에서) */
    const val TIP_MIN: Int = 100
    const val TIP_MAX: Int = 1_000

    /** 1P 원화 환산 (회계·출금 용도) */
    const val WON_PER_POINT: Int = 10
}

/**
 * 충전 묶음 (P). 정가 + 보너스. ADR 0042 §1.
 * `priceWon` = 사용자가 결제하는 원화, `pointsCredited` = 잔액에 적립되는 P.
 */
data class PointBundle(
    val pointsCredited: Int,
    val priceWon: Int,
) {
    /** 정가 대비 단가 절감률 (%). 보너스 없으면 0. */
    fun bonusPercent(): Int {
        val basePrice = pointsCredited * PointPrice.WON_PER_POINT  // 1:10 비율 기준 정가
        return if (basePrice <= priceWon) 0
        else ((basePrice - priceWon) * 100 / basePrice)
    }
}

object PointBundleCatalog {
    val BUNDLES: List<PointBundle> = listOf(
        PointBundle(pointsCredited = 500,   priceWon = 5_000),    // 정가
        PointBundle(pointsCredited = 1_100, priceWon = 10_000),   // +100P (10% 보너스)
        PointBundle(pointsCredited = 3_400, priceWon = 30_000),   // +400P (13% 보너스)
        PointBundle(pointsCredited = 5_750, priceWon = 50_000),   // +750P (15% 보너스)
    )
}
