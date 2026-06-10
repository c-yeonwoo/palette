package kr.ai.palette.palettepick.domain

import java.time.LocalDate
import java.util.UUID

/**
 * 팔레트픽 추천 도메인 (ADR 0047 §B).
 *
 * 매일 자정 KST 배치로 생성. 사용자 진입 시 즉시 응답 (cached).
 * 비구독자 — 미리보기 1장 (티저만, 프로필 잠금).
 * 구독자 — 상세 reasoning + conversation starters 노출.
 *
 * Phase B.0 (현재) — 도메인 stub. 구현은 B.1+ 에서 application/persistence wire.
 */
data class PalettePickRecommendation(
    val id: UUID,
    val viewerUserId: UUID,
    val candidateUserId: UUID,
    val recommendedDate: LocalDate,
    val rank: Int,                          // 1·2·3 (당일 추천 순서)
    val deterministicScore: PalettePickScore,
    val llmRubric: CompatibilityRubric?,    // 비구독자에겐 null (Stage 3 skip)
    val viewedAt: java.time.Instant? = null, // 사용자 진입 추적
)
