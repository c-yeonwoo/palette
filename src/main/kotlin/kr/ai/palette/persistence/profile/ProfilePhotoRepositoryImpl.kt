package kr.ai.palette.persistence.profile

import kr.ai.palette.domain.profile.*
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Repository

@Repository
class ProfilePhotoRepositoryImpl(
    private val jpaRepository: ProfilePhotoJpaRepository,
    private val mapper: ProfilePhotoMapper
) : ProfilePhotoRepository {

    override fun save(photo: ProfilePhoto): ProfilePhoto {
        val entity = mapper.toEntity(photo)
        val savedEntity = jpaRepository.save(entity)
        return mapper.toDomain(savedEntity)
    }

    override fun findById(id: ProfilePhotoId): ProfilePhoto? {
        return jpaRepository.findByIdOrNull(id.value)?.let { mapper.toDomain(it) }
    }

    override fun findByProfileId(profileId: ProfileId): List<ProfilePhoto> {
        return jpaRepository.findByProfileId(profileId.value).map { mapper.toDomain(it) }
    }

    override fun findPrimaryByProfileId(profileId: ProfileId): ProfilePhoto? {
        return jpaRepository.findByProfileId(profileId.value)
            .firstOrNull { it.isPrimary }
            ?.let { mapper.toDomain(it) }
    }

    override fun delete(id: ProfilePhotoId) {
        jpaRepository.deleteById(id.value)
    }

    override fun deleteByProfileId(profileId: ProfileId) {
        jpaRepository.deleteByProfileId(profileId.value)
    }
}
