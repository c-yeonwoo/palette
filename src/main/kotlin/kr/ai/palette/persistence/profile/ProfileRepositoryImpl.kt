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
    private val mapper: ProfileMapper,
    private val photoRepository: kr.ai.palette.domain.profile.ProfilePhotoRepository
) : ProfileRepository {

    override fun save(profile: Profile): Profile {
        val entity = mapper.toEntity(profile)
        val savedEntity = jpaRepository.save(entity)
        val savedProfile = mapper.toDomain(savedEntity)
        // Load photos separately
        val photos = photoRepository.findByProfileId(savedProfile.id)
        return savedProfile.copy(photos = photos)
    }

    override fun findById(id: ProfileId): Profile? {
        val entity = jpaRepository.findByIdOrNull(id.value) ?: return null
        val profile = mapper.toDomain(entity)
        // Load photos separately
        val photos = photoRepository.findByProfileId(id)
        return profile.copy(photos = photos)
    }

    override fun findByUserId(userId: UserId): Profile? {
        val entity = jpaRepository.findByUserId(userId.value) ?: return null
        val profile = mapper.toDomain(entity)
        // Load photos separately
        val photos = photoRepository.findByProfileId(profile.id)
        return profile.copy(photos = photos)
    }

    override fun existsByUserId(userId: UserId): Boolean {
        return jpaRepository.existsByUserId(userId.value)
    }

    override fun findAll(): List<Profile> {
        return jpaRepository.findAll().map { entity ->
            val profile = mapper.toDomain(entity)
            val photos = photoRepository.findByProfileId(profile.id)
            profile.copy(photos = photos)
        }
    }
}
