package kr.ai.palette.persistence.matchmaker

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaker.Matchmaker
import kr.ai.palette.domain.matchmaker.MatchmakerId
import kr.ai.palette.domain.matchmaker.MatchmakerRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class MatchmakerRepositoryImpl(
    private val jpaRepository: MatchmakerJpaRepository,
    private val mapper: MatchmakerMapper
) : MatchmakerRepository {

    override fun save(matchmaker: Matchmaker): Matchmaker {
        val entity = jpaRepository.findById(matchmaker.id.value)
            .orElse(null)

        return if (entity != null) {
            mapper.updateEntity(entity, matchmaker)
            mapper.toDomain(jpaRepository.save(entity))
        } else {
            val newEntity = mapper.toEntity(matchmaker)
            mapper.toDomain(jpaRepository.save(newEntity))
        }
    }

    @Transactional(readOnly = true)
    override fun findById(id: MatchmakerId): Matchmaker? {
        return jpaRepository.findById(id.value)
            .map { mapper.toDomain(it) }
            .orElse(null)
    }

    @Transactional(readOnly = true)
    override fun findByUserId(userId: UserId): Matchmaker? {
        return jpaRepository.findByUserId(userId.value)
            ?.let { mapper.toDomain(it) }
    }

    @Transactional(readOnly = true)
    override fun existsByUserId(userId: UserId): Boolean {
        return jpaRepository.existsByUserId(userId.value)
    }

    override fun delete(id: MatchmakerId) {
        jpaRepository.deleteById(id.value)
    }
}
