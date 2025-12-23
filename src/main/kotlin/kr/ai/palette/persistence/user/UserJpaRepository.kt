package kr.ai.palette.persistence.user

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface UserJpaRepository : JpaRepository<UserEntity, UUID> {
    fun findByNickname(nickname: String): UserEntity?
    fun findByOauthProviderAndOauthId(provider: OAuthProviderEntity, oauthId: String): UserEntity?
    fun existsByNickname(nickname: String): Boolean
}
