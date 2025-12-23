package kr.ai.palette.persistence.profile

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ProfileVideoJpaRepository : JpaRepository<ProfileVideoEntity, UUID> {
    fun findByProfileId(profileId: UUID): ProfileVideoEntity?
    fun deleteByProfileId(profileId: UUID)
}
