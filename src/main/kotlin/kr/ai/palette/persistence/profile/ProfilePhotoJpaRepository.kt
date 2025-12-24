package kr.ai.palette.persistence.profile

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ProfilePhotoJpaRepository : JpaRepository<ProfilePhotoEntity, UUID> {
    fun findByProfileId(profileId: UUID): List<ProfilePhotoEntity>
    fun deleteByProfileId(profileId: UUID)
}
