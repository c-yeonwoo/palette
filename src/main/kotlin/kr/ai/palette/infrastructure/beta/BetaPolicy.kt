package kr.ai.palette.infrastructure.beta

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

/**
 * 베타 정책 단일 소스 (SoT).
 *
 * `app.beta.free-unlock` (기본 true) — 베타 기간 동안 **물감 소비 전면 무료**.
 *   - 프로필 열람(친친/한다리더) · 소개 요청 모두 차감 없이 진행
 *   - 프론트는 viewCost 0 / canView=true 로 결제·충전 유도를 숨김
 *
 * 정식 출시 시 `BETA_FREE_UNLOCK=false` 로 끄면 정상 과금:
 *   - 친친 열람 20 물감 / 한 다리 더 30 물감 (PointPrice = SoT), 소개 요청 [PointPrice.INTRO_REQUEST]
 *
 * 가격 자체(20/30)는 PointPrice 에 그대로 두고, "지금 받느냐 마느냐"만 이 플래그가 결정한다.
 * (베타 게이트인 app.beta-code 와는 별개 — 그건 가입 접근 제어, 이건 과금 제어)
 */
@Component
class BetaPolicy(
    @Value("\${app.beta.free-unlock:true}")
    val freeUnlock: Boolean,
)
