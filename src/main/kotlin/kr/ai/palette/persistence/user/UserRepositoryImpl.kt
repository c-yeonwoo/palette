package kr.ai.palette.persistence.user

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.OAuthProvider
import kr.ai.palette.domain.user.User
import kr.ai.palette.domain.user.UserRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class UserRepositoryImpl(
    private val jpaRepository: UserJpaRepository,
    private val mapper: UserMapper
) : UserRepository {

    override fun save(user: User): User {
        val entity = jpaRepository.findById(user.id.value)
            .orElse(null)

        return if (entity != null) {
            mapper.updateEntity(entity, user)
            mapper.toDomain(jpaRepository.save(entity))
        } else {
            val newEntity = mapper.toEntity(user)
            mapper.toDomain(jpaRepository.save(newEntity))
        }
    }

    @Transactional(readOnly = true)
    override fun findById(id: UserId): User? {
        return jpaRepository.findById(id.value)
            .map { mapper.toDomain(it) }
            .orElse(null)
    }

    @Transactional(readOnly = true)
    override fun findByNickname(nickname: String): User? {
        return jpaRepository.findByNickname(nickname)
            ?.let { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun findByEmail(email: String): User? {
        return jpaRepository.findByEmail(email)
            ?.let { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun findByOAuthInfo(provider: OAuthProvider, oauthId: String): User? {
        val providerEntity = OAuthProviderEntity.valueOf(provider.name)
        return jpaRepository.findByOauthProviderAndOauthId(providerEntity, oauthId)
            ?.let { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun existsByNickname(nickname: String): Boolean {
        return jpaRepository.existsByNickname(nickname)
    }

    @Transactional(readOnly = true)
    override fun existsByEmail(email: String): Boolean {
        return jpaRepository.existsByEmail(email)
    }

    override fun delete(id: UserId) {
        jpaRepository.deleteById(id.value)
    }

    @Transactional(readOnly = true)
    override fun findAll(): List<User> {
        return jpaRepository.findAll()
            .map { mapper.toDomain(it) }
    }
}
