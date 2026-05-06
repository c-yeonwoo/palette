package kr.ai.palette.persistence.vouch

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface VouchJpaRepository : JpaRepository<VouchEntity, UUID> {
    fun findByTargetUserId(targetUserId: String): List<VouchEntity>
    fun findByTargetUserIdAndVoucherId(targetUserId: String, voucherId: String): VouchEntity?
    fun existsByTargetUserIdAndVoucherId(targetUserId: String, voucherId: String): Boolean

    @Modifying
    @Query("DELETE FROM VouchEntity v WHERE v.targetUserId = :targetUserId AND v.voucherId = :voucherId")
    fun deleteByTargetUserIdAndVoucherId(targetUserId: String, voucherId: String)
}
