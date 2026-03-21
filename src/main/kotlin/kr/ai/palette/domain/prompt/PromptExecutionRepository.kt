package kr.ai.palette.domain.prompt

import kr.ai.palette.domain.common.UserId

/**
 * 프롬프트 실행 이력 Repository 인터페이스
 */
interface PromptExecutionRepository {
    /**
     * 프롬프트 실행 이력 저장
     */
    fun save(execution: PromptExecution): PromptExecution

    /**
     * ID로 실행 이력 조회
     */
    fun findById(id: PromptExecutionId): PromptExecution?

    /**
     * 프롬프트 ID로 실행 이력 조회
     */
    fun findByPromptId(promptId: PromptId): List<PromptExecution>

    /**
     * 사용자 ID로 실행 이력 조회
     */
    fun findByUserId(userId: UserId): List<PromptExecution>

    /**
     * 프롬프트 ID와 사용자 ID로 실행 이력 조회
     */
    fun findByPromptIdAndUserId(promptId: PromptId, userId: UserId): List<PromptExecution>

    /**
     * 상태별 실행 이력 조회
     */
    fun findByStatus(status: ExecutionStatus): List<PromptExecution>

    /**
     * 실행 이력 삭제
     */
    fun delete(id: PromptExecutionId)
}
