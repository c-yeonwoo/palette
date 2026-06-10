package kr.ai.palette.palettepick.domain

/**
 * 팔레트픽 LLM 분석 결과 (ADR 0047 §B.3 Stage 3).
 *
 * 두 사람 (viewer ↔ candidate) 프로필을 LLM 이 종합 비교하고 산출:
 *  · score: 0-100 종합 어울림 점수 (Stage 2 결정 점수와 조합)
 *  · reasoning: "왜 잘 맞는가" 3-4문장 (사용자에게 노출)
 *  · strengths: 매칭 강점 3개 (예: "공통 관심사 강함", "라이프스타일 일치")
 *  · conversationStarters: 첫 대화 주제 추천 3-5개
 *
 * 캐시 키: hash(viewerId + candidateId + 양쪽 profile.updatedAt) — 한쪽 프로필 갱신 시 재계산.
 */
data class CompatibilityRubric(
    val score: Int,
    val reasoning: String,
    val strengths: List<String>,
    val conversationStarters: List<String>,
)
