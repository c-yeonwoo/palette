package kr.ai.palette.domain.prompt

/**
 * 프롬프트 카테고리
 */
enum class PromptCategory(val displayName: String, val description: String) {
    /**
     * 프로필 요약 생성
     */
    PROFILE_SUMMARY(
        displayName = "프로필 요약",
        description = "사용자 프로필을 분석하여 매력적인 요약문을 생성합니다."
    ),

    /**
     * 이상형 분석
     */
    IDEAL_TYPE_ANALYSIS(
        displayName = "이상형 분석",
        description = "사용자의 이상형 선호도를 분석하고 설명을 생성합니다."
    ),

    /**
     * 자기소개 향상
     */
    INTRODUCTION_ENHANCEMENT(
        displayName = "자기소개 향상",
        description = "사용자가 작성한 자기소개를 더 매력적으로 개선합니다."
    ),

    /**
     * 색깔 타입 추천
     */
    COLOR_TYPE_RECOMMENDATION(
        displayName = "색깔 타입 추천",
        description = "사용자의 성격과 특성을 분석하여 어울리는 색깔 타입을 추천합니다."
    ),

    /**
     * 매칭 추천 이유
     */
    MATCH_REASON(
        displayName = "매칭 추천 이유",
        description = "두 사용자가 어울리는 이유를 분석하여 설명합니다."
    ),

    /**
     * AI 인터뷰 질문 생성
     */
    INTERVIEW_QUESTION(
        displayName = "AI 인터뷰 질문",
        description = "사용자 프로필 생성을 위한 대화형 질문을 생성합니다."
    ),

    /**
     * 일반 목적
     */
    GENERAL(
        displayName = "일반",
        description = "범용 프롬프트"
    )
}
