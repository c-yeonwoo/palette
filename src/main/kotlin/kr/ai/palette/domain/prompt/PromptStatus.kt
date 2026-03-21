package kr.ai.palette.domain.prompt

/**
 * 프롬프트 상태
 */
enum class PromptStatus {
    /**
     * 초안 - 아직 활성화되지 않음
     */
    DRAFT,

    /**
     * 활성 - 사용 가능한 상태
     */
    ACTIVE,

    /**
     * 보관됨 - 더 이상 사용하지 않음
     */
    ARCHIVED
}
