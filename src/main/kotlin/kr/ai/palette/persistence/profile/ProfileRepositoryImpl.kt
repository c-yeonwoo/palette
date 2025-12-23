package kr.ai.palette.persistence.profile

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.Profile
import kr.ai.palette.domain.profile.ProfileId
import kr.ai.palette.domain.profile.ProfileRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class ProfileRepositoryImpl(
    private val jpaRepository: ProfileJpaRepository,
    private val mapper: ProfileMapper
) : ProfileRepository {

    override fun save(profile: Profile): Profile {
        val entity = jpaRepository.findById(profile.id.value)
            .orElse(null)

        return if (entity != null) {
            mapper.updateEntity(entity, profile)
            mapper.toDomain(jpaRepository.save(entity))
        } else {
            val newEntity = mapper.toEntity(profile)
            mapper.toDomain(jpaRepository.save(newEntity))
        }
    }

    @Transactional(readOnly = true)
    override fun findById(id: ProfileId): Profile? {
        return jpaRepository.findById(id.value)
            .map { mapper.toDomain(it) }
            .orElse(null)
    }

    @Transactional(readOnly = true)
    override fun findByUserId(userId: UserId): Profile? {
        return jpaRepository.findByUserId(userId.value)
            ?.let { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun existsByUserId(userId: UserId): Boolean {
        return jpaRepository.existsByUserId(userId.value)
    }

    override fun delete(id: ProfileId) {
        jpaRepository.deleteById(id.value)
    }
}
