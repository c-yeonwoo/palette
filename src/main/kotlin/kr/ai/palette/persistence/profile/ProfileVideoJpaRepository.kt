package kr.ai.palette.persistence.profile

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ProfileVideoJpaRepository : JpaRepository<ProfileVideoEntity, UUID> {
    fun findByProfileId(profileId: UUID): List<ProfileVideoEntity>
    fun deleteByProfileId(profileId: UUID)
}
