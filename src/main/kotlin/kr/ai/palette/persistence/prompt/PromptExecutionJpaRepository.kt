package kr.ai.palette.persistence.prompt

import kr.ai.palette.domain.prompt.ExecutionStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PromptExecutionJpaRepository : JpaRepository<PromptExecutionEntity, String> {
    fun findByPromptId(promptId: String): List<PromptExecutionEntity>
    fun findByUserId(userId: String): List<PromptExecutionEntity>
    fun findByPromptIdAndUserId(promptId: String, userId: String): List<PromptExecutionEntity>
    fun findByStatus(status: ExecutionStatus): List<PromptExecutionEntity>
}
