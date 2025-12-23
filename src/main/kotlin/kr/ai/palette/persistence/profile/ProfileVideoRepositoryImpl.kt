package kr.ai.palette.persistence.profile

import kr.ai.palette.domain.profile.ProfileId
import kr.ai.palette.domain.profile.ProfileVideo
import kr.ai.palette.domain.profile.ProfileVideoId
import kr.ai.palette.domain.profile.ProfileVideoRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class ProfileVideoRepositoryImpl(
    private val jpaRepository: ProfileVideoJpaRepository,
    private val mapper: ProfileVideoMapper
) : ProfileVideoRepository {

    override fun save(video: ProfileVideo): ProfileVideo {
        val entity = jpaRepository.findById(video.id.value)
            .orElse(null)

        return if (entity != null) {
            mapper.updateEntity(entity, video)
            mapper.toDomain(jpaRepository.save(entity))
        } else {
            val newEntity = mapper.toEntity(video)
            mapper.toDomain(jpaRepository.save(newEntity))
        }
    }

    @Transactional(readOnly = true)
    override fun findById(id: ProfileVideoId): ProfileVideo? {
        return jpaRepository.findById(id.value)
            .map { mapper.toDomain(it) }
            .orElse(null)
    }

    @Transactional(readOnly = true)
    override fun findByProfileId(profileId: ProfileId): ProfileVideo? {
        return jpaRepository.findByProfileId(profileId.value)
            ?.let { mapper.toDomain(it) }
    }

    override fun delete(id: ProfileVideoId) {
        jpaRepository.deleteById(id.value)
    }

    override fun deleteByProfileId(profileId: ProfileId) {
        jpaRepository.deleteByProfileId(profileId.value)
    }
}
