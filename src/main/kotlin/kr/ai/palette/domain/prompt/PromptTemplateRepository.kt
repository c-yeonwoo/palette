package kr.ai.palette.domain.prompt

/**
 * 프롬프트 템플릿 Repository 인터페이스
 */
interface PromptTemplateRepository {
    /**
     * 프롬프트 템플릿 저장
     */
    fun save(promptTemplate: PromptTemplate): PromptTemplate

    /**
     * ID로 프롬프트 템플릿 조회
     */
    fun findById(id: PromptId): PromptTemplate?

    /**
     * 모든 프롬프트 템플릿 조회
     */
    fun findAll(): List<PromptTemplate>

    /**
     * 카테고리별 프롬프트 템플릿 조회
     */
    fun findByCategory(category: PromptCategory): List<PromptTemplate>

    /**
     * 상태별 프롬프트 템플릿 조회
     */
    fun findByStatus(status: PromptStatus): List<PromptTemplate>

    /**
     * 활성화된 프롬프트 템플릿만 조회
     */
    fun findAllActive(): List<PromptTemplate> = findByStatus(PromptStatus.ACTIVE)

    /**
     * 프롬프트 템플릿 삭제
     */
    fun delete(id: PromptId)

    /**
     * 프롬프트 템플릿 존재 여부 확인
     */
    fun existsById(id: PromptId): Boolean
}
