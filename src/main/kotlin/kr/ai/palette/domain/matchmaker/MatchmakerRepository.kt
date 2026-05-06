package kr.ai.palette.domain.matchmaker

import kr.ai.palette.domain.common.UserId

interface MatchmakerRepository {
    fun save(matchmaker: Matchmaker): Matchmaker
    fun findById(id: MatchmakerId): Matchmaker?
    fun findByUserId(userId: UserId): Matchmaker?
    fun existsByUserId(userId: UserId): Boolean
    fun delete(id: MatchmakerId)
    fun findPublicMatchmakers(page: Int, size: Int): List<Matchmaker>
}
