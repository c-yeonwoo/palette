package kr.ai.palette.domain.billing

/**
 * 결제 모델 SoT — ADR 0042 (단일 잔액 모델).
 *
 * **단위**: 사용자 노출 "물감" (Paint). `1 물감 = 100원 (KRW)`.
 * 코드 내부 변수명은 `point` / `P` 유지 — UI 라벨만 "물감"으로.
 *
 * 사용자 결제 3축:
 *  1) 잔액 (물감) — 모든 사용처 공통 차감 단위
 *  2) 성의 표시 — 잔액에서 자유 금액 송금 (옵셔널 tip)
 *  3) 팔레트 Pick 패스 — 월 구독 (`AiPassSubscription` 별도)
 *
 * 베타: 결제 미연동 — 충전은 stub. 정식: Toss confirm → 잔액 적립.
 */

/** 사용처별 차감 가격 (물감 단위). */
object PointPrice {
    /** 1촌 친구 본인 프로필 열람 — 무료 */
    const val FRIEND_VIEW: Int = 0

    /** 친구의 친구(2촌) 프로필 열람 */
    const val FRIEND_OF_FRIEND_VIEW: Int = 10    // = 1,000원

    /** 한 다리 더 건너 (3촌) 프로필 열람 */
    const val FURTHER_VIEW: Int = 20             // = 2,000원

    /** 소개 요청 1회 */
    const val INTRO_REQUEST: Int = 30            // = 3,000원

    /** 팁 최소/최대 (자유 금액 안에서) */
    const val TIP_MIN: Int = 10                  // = 1,000원
    const val TIP_MAX: Int = 100                 // = 10,000원

    /** 1 물감 원화 환산 (회계·출금 용도) */
    const val WON_PER_POINT: Int = 100
}

/**
 * 충전 묶음. ADR 0042.
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
        PointBundle(pointsCredited = 110, priceWon = 10_000),   // +10 물감 (10%)
        PointBundle(pointsCredited = 340, priceWon = 30_000),   // +40 물감 (13%)
        PointBundle(pointsCredited = 575, priceWon = 50_000),   // +75 물감 (15%)
    )
}
