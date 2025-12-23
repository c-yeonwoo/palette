package kr.ai.palette.persistence.profile

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ProfilePhotoJpaRepository : JpaRepository<ProfilePhotoEntity, UUID> {
    fun findByProfileIdOrderByDisplayOrder(profileId: UUID): List<ProfilePhotoEntity>
    fun findByProfileIdAndIsPrimaryTrue(profileId: UUID): ProfilePhotoEntity?
    fun deleteByProfileId(profileId: UUID)
}
