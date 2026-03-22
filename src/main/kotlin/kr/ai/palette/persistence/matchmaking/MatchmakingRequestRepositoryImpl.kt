package kr.ai.palette.persistence.matchmaking

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequest
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import org.springframework.stereotype.Repository

@Repository
class MatchmakingRequestRepositoryImpl(
    private val jpaRepository: MatchmakingRequestJpaRepository,
    private val mapper: MatchmakingRequestMapper
) : MatchmakingRequestRepository {

    override fun save(request: MatchmakingRequest): MatchmakingRequest {
        val entity = mapper.toEntity(request)
        val saved = jpaRepository.save(entity)
        return mapper.toDomain(saved)
    }

    override fun findById(id: MatchmakingRequestId): MatchmakingRequest? {
        return jpaRepository.findById(id.value)
            .map { mapper.toDomain(it) }
            .orElse(null)
    }

    override fun findByMatchmakerId(matchmakerId: UserId): List<MatchmakingRequest> {
        return jpaRepository.findByMatchmakerId(matchmakerId.value)
            .map { mapper.toDomain(it) }
    }

    override fun existsByRequesterIdAndTargetUserId(requesterId: UserId, targetUserId: UserId): Boolean {
        return jpaRepository.existsByRequesterIdAndTargetUserId(requesterId.value, targetUserId.value)
    }

    override fun findByRequesterIdAndTargetUserId(requesterId: UserId, targetUserId: UserId): MatchmakingRequest? {
        return jpaRepository.findByRequesterIdAndTargetUserId(requesterId.value, targetUserId.value)
            ?.let { mapper.toDomain(it) }
    }

    override fun findAll(): List<MatchmakingRequest> {
        return jpaRepository.findAll().map { mapper.toDomain(it) }
    }

    override fun findByTargetUserId(targetUserId: UserId): List<MatchmakingRequest> {
        return jpaRepository.findByTargetUserId(targetUserId.value)
            .map { mapper.toDomain(it) }
    }

    override fun findByRequesterIdAndStatus(requesterId: UserId, status: MatchmakingRequestStatus): List<MatchmakingRequest> {
        return jpaRepository.findByRequesterIdAndStatus(requesterId.value, status.name)
            .map { mapper.toDomain(it) }
    }

    override fun findByStatus(status: MatchmakingRequestStatus): List<MatchmakingRequest> {
        return jpaRepository.findByStatus(status.name).map { mapper.toDomain(it) }
    }
}
