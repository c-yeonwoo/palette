package kr.ai.palette.persistence.prompt

import kr.ai.palette.domain.prompt.PromptCategory
import kr.ai.palette.domain.prompt.PromptStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PromptTemplateJpaRepository : JpaRepository<PromptTemplateEntity, String> {
    fun findByCategory(category: PromptCategory): List<PromptTemplateEntity>
    fun findByStatus(status: PromptStatus): List<PromptTemplateEntity>
}
