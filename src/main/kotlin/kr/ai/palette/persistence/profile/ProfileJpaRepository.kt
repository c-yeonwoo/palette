package kr.ai.palette.persistence.profile

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ProfileJpaRepository : JpaRepository<ProfileEntity, UUID> {
    fun findByUserId(userId: UUID): ProfileEntity?
    fun existsByUserId(userId: UUID): Boolean
}
