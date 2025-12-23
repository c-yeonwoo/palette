package kr.ai.palette.domain.user

import kr.ai.palette.domain.common.UserId

interface UserRepository {
    fun save(user: User): User
    fun findById(id: UserId): User?
    fun findByNickname(nickname: String): User?
    fun findByOAuthInfo(provider: OAuthProvider, oauthId: String): User?
    fun existsByNickname(nickname: String): Boolean
    fun delete(id: UserId)
}
