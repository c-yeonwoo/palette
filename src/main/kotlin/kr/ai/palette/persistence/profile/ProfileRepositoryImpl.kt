package kr.ai.palette.persistence.profile

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.Profile
import kr.ai.palette.domain.profile.ProfileId
import kr.ai.palette.domain.profile.ProfileRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Repository

@Repository
class ProfileRepositoryImpl(
    private val jpaRepository: ProfileJpaRepository,
    private val mapper: ProfileMapper
) : ProfileRepository {

    override fun save(profile: Profile): Profile {
        val entity = mapper.toEntity(profile)
        val savedEntity = jpaRepository.save(entity)
        return mapper.toDomain(savedEntity)
    }

    override fun findById(id: ProfileId): Profile? {
        return jpaRepository.findByIdOrNull(id.value)?.let { mapper.toDomain(it) }
    }

    override fun findByUserId(userId: UserId): Profile? {
        return jpaRepository.findByUserId(userId.value)?.let { mapper.toDomain(it) }
    }

    override fun existsByUserId(userId: UserId): Boolean {
        return jpaRepository.existsByUserId(userId.value)
    }
}
