package kr.ai.palette.persistence.profile

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ProfileJpaRepository : JpaRepository<ProfileEntity, UUID> {
    fun findByUserId(userId: UUID): ProfileEntity?
    fun existsByUserId(userId: UUID): Boolean
}
