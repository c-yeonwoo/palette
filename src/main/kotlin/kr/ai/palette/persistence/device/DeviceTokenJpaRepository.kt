package kr.ai.palette.persistence.device

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface DeviceTokenJpaRepository : JpaRepository<DeviceTokenEntity, UUID> {
    fun findByUserId(userId: String): List<DeviceTokenEntity>
    fun findByToken(token: String): DeviceTokenEntity?

    @Modifying
    @Query("DELETE FROM DeviceTokenEntity d WHERE d.token = :token")
    fun deleteByToken(token: String)

    @Modifying
    @Query("DELETE FROM DeviceTokenEntity d WHERE d.userId = :userId")
    fun deleteByUserId(userId: String)
}
