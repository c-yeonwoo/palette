package kr.ai.palette.domain.prompt

/**
 * 프롬프트 실행 상태
 */
enum class ExecutionStatus {
    /**
     * 실행 성공
     */
    SUCCESS,

    /**
     * 실행 실패
     */
    FAILED,

    /**
     * 시간 초과
     */
    TIMEOUT,

    /**
     * 진행 중
     */
    IN_PROGRESS
}
