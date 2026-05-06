package kr.ai.palette.persistence.sharelink

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ShareLinkJpaRepository : JpaRepository<ShareLinkEntity, String> {
    fun findByUserId(userId: UUID): ShareLinkEntity?
}
