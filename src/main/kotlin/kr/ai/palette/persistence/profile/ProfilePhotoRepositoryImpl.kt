package kr.ai.palette.persistence.profile

import kr.ai.palette.domain.profile.ProfileId
import kr.ai.palette.domain.profile.ProfilePhoto
import kr.ai.palette.domain.profile.ProfilePhotoId
import kr.ai.palette.domain.profile.ProfilePhotoRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class ProfilePhotoRepositoryImpl(
    private val jpaRepository: ProfilePhotoJpaRepository,
    private val mapper: ProfilePhotoMapper
) : ProfilePhotoRepository {

    override fun save(photo: ProfilePhoto): ProfilePhoto {
        val entity = jpaRepository.findById(photo.id.value)
            .orElse(null)

        return if (entity != null) {
            mapper.updateEntity(entity, photo)
            mapper.toDomain(jpaRepository.save(entity))
        } else {
            val newEntity = mapper.toEntity(photo)
            mapper.toDomain(jpaRepository.save(newEntity))
        }
    }

    @Transactional(readOnly = true)
    override fun findById(id: ProfilePhotoId): ProfilePhoto? {
        return jpaRepository.findById(id.value)
            .map { mapper.toDomain(it) }
            .orElse(null)
    }

    @Transactional(readOnly = true)
    override fun findByProfileId(profileId: ProfileId): List<ProfilePhoto> {
        return jpaRepository.findByProfileIdOrderByDisplayOrder(profileId.value)
            .map { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun findPrimaryByProfileId(profileId: ProfileId): ProfilePhoto? {
        return jpaRepository.findByProfileIdAndIsPrimaryTrue(profileId.value)
            ?.let { mapper.toDomain(it) }
    }

    override fun delete(id: ProfilePhotoId) {
        jpaRepository.deleteById(id.value)
    }

    override fun deleteByProfileId(profileId: ProfileId) {
        jpaRepository.deleteByProfileId(profileId.value)
    }
}
