package kr.ai.palette.persistence.prompt

import kr.ai.palette.domain.prompt.*
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class PromptTemplateRepositoryImpl(
    private val jpaRepository: PromptTemplateJpaRepository,
    private val mapper: PromptTemplateMapper
) : PromptTemplateRepository {

    override fun save(promptTemplate: PromptTemplate): PromptTemplate {
        val existingEntity = jpaRepository.findByIdOrNull(promptTemplate.id.value)

        return if (existingEntity != null) {
            mapper.updateEntity(existingEntity, promptTemplate)
            mapper.toDomain(jpaRepository.save(existingEntity))
        } else {
            val newEntity = mapper.toEntity(promptTemplate)
            mapper.toDomain(jpaRepository.save(newEntity))
        }
    }

    @Transactional(readOnly = true)
    override fun findById(id: PromptId): PromptTemplate? {
        return jpaRepository.findByIdOrNull(id.value)?.let { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun findAll(): List<PromptTemplate> {
        return jpaRepository.findAll().map { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun findByCategory(category: PromptCategory): List<PromptTemplate> {
        return jpaRepository.findByCategory(category).map { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun findByStatus(status: PromptStatus): List<PromptTemplate> {
        return jpaRepository.findByStatus(status).map { mapper.toDomain(it) }
    }

    override fun delete(id: PromptId) {
        jpaRepository.deleteById(id.value)
    }

    @Transactional(readOnly = true)
    override fun existsById(id: PromptId): Boolean {
        return jpaRepository.existsById(id.value)
    }
}
