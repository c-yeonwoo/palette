package kr.ai.palette.persistence.prompt

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.prompt.*
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class PromptExecutionRepositoryImpl(
    private val jpaRepository: PromptExecutionJpaRepository,
    private val mapper: PromptExecutionMapper
) : PromptExecutionRepository {

    override fun save(execution: PromptExecution): PromptExecution {
        val existingEntity = jpaRepository.findByIdOrNull(execution.id.value)

        return if (existingEntity != null) {
            mapper.updateEntity(existingEntity, execution)
            mapper.toDomain(jpaRepository.save(existingEntity))
        } else {
            val newEntity = mapper.toEntity(execution)
            mapper.toDomain(jpaRepository.save(newEntity))
        }
    }

    @Transactional(readOnly = true)
    override fun findById(id: PromptExecutionId): PromptExecution? {
        return jpaRepository.findByIdOrNull(id.value)?.let { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun findByPromptId(promptId: PromptId): List<PromptExecution> {
        return jpaRepository.findByPromptId(promptId.value).map { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun findByUserId(userId: UserId): List<PromptExecution> {
        return jpaRepository.findByUserId(userId.value.toString()).map { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun findByPromptIdAndUserId(promptId: PromptId, userId: UserId): List<PromptExecution> {
        return jpaRepository.findByPromptIdAndUserId(promptId.value, userId.value.toString())
            .map { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun findByStatus(status: ExecutionStatus): List<PromptExecution> {
        return jpaRepository.findByStatus(status).map { mapper.toDomain(it) }
    }

    override fun delete(id: PromptExecutionId) {
        jpaRepository.deleteById(id.value)
    }
}
