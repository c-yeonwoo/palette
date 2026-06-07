package kr.ai.palette.domain.billing

/**
 * 결제 모델 SoT — ADR 0039.
 *
 * 사용자 결제는 네 갈래:
 *  1) 프로필 열람 티켓 (ViewTicket)        — 프로필 상세 열람 시 차감 (친친 1장 / 한다리 더 2장)
 *  2) 소개 요청 티켓 (IntroRequestTicket)  — 주선자에게 소개 요청 시 1장 차감
 *  3) 성의 표시 포인트 (TipPoints, 옵셔널) — 주선자에게 자유 금액 송금. 매칭 알고리즘 미반영.
 *  4) 팔레트 Pick 패스 (월 구독)           — `AiPassSubscription` 별도 도메인
 *
 * 베타: 결제 미연동 — 충전은 stub(무료 발급), 차감만 정상 동작.
 * Phase 2: Toss 결제 실연동 후 충전 stub 제거.
 */
enum class TicketKind {
    VIEW,            // 프로필 열람 티켓
    INTRO_REQUEST,   // 소개 요청 티켓
}

/**
 * 묶음 상품 정의 (POLICY §1.2b).
 * 베타엔 정책 문서 노출만 — Phase 2 결제 화면 연동 시 사용.
 */
data class TicketBundle(
    val kind: TicketKind,
    val quantity: Int,
    val priceWon: Int,
) {
    /** 낱장 정가 대비 단가 절감률 (%). */
    fun discountPercent(unitPriceWon: Int): Int =
        100 - (priceWon * 100 / (unitPriceWon * quantity))
}

object TicketBundleCatalog {

    /** 프로필 열람 티켓 낱장 정가. 친친 1장(1,000원) 기준 단가. */
    const val VIEW_UNIT_PRICE_WON: Int = 1_000

    /** 소개 요청 티켓 낱장 정가. ADR 0039. */
    const val INTRO_REQUEST_UNIT_PRICE_WON: Int = 3_000

    val VIEW_BUNDLES: List<TicketBundle> = listOf(
        TicketBundle(TicketKind.VIEW, 1, 1_000),
        TicketBundle(TicketKind.VIEW, 5, 4_500),    // 10% ↓
        TicketBundle(TicketKind.VIEW, 10, 8_500),   // 15% ↓
    )

    val INTRO_REQUEST_BUNDLES: List<TicketBundle> = listOf(
        TicketBundle(TicketKind.INTRO_REQUEST, 1, 3_000),
        TicketBundle(TicketKind.INTRO_REQUEST, 5, 13_500),
        TicketBundle(TicketKind.INTRO_REQUEST, 10, 25_500),
    )
}
