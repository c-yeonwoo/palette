package kr.ai.palette.presentation.league

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.user.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.YearMonth
import java.time.temporal.ChronoUnit

enum class LeagueTier(val label: String, val minMatches: Int, val emoji: String, val color: String) {
    BRONZE("브론즈 큐피드", 0, "🥉", "#CD7F32"),
    SILVER("실버 큐피드", 3, "🥈", "#C0C0C0"),
    GOLD("골드 큐피드", 6, "🥇", "#FFD700"),
    PLATINUM("플래티넘 큐피드", 11, "💎", "#E5E4E2"),
    DIAMOND("다이아 큐피드", 21, "👑", "#B9F2FF");

    companion object {
        fun fromMatches(count: Int): LeagueTier =
            values().filter { it.minMatches <= count }.maxByOrNull { it.minMatches } ?: BRONZE
    }
}

data class LeagueRankEntry(
    val rank: Int,
    val userId: String,
    val nickname: String,
    val successCount: Int,
    val tier: String,
    val tierEmoji: String,
    val tierColor: String,
    val isMe: Boolean
)

data class SeasonInfo(
    val seasonName: String,
    val startDate: String,
    val endDate: String,
    val daysRemaining: Int
)

data class LeagueResponse(
    val season: SeasonInfo,
    val myRank: Int?,
    val mySuccessCount: Int,
    val myTier: String,
    val myTierEmoji: String,
    val myTierColor: String,
    val topRankers: List<LeagueRankEntry>,
    val totalParticipants: Int
)

@RestController
@RequestMapping("/api/v1/league")
class LeagueController(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val userRepository: UserRepository,
    private val seedUserPolicy: kr.ai.palette.infrastructure.seed.SeedUserPolicy,
) {

    @GetMapping
    fun getLeague(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<LeagueResponse> {
        val myId = authUser.userId
        val today = LocalDate.now()
        val currentMonth = YearMonth.of(today.year, today.month)
        val seasonStart = currentMonth.atDay(1)
        val seasonEnd = currentMonth.atEndOfMonth()
        val daysRemaining = ChronoUnit.DAYS.between(today, seasonEnd).toInt().coerceAtLeast(0)

        // 시드 격리: 일반(non-seed) 가입자에게는 시드 주선자 랭킹 숨김
        val me = userRepository.findById(myId)
        val exposeSeed = me?.let { seedUserPolicy.shouldExposeSeedTo(it) } ?: false

        // 이번 시즌(이번 달) 성공한 매칭 집계
        val seasonStartDateTime = seasonStart.atStartOfDay()
        val allCompleted = matchmakingRequestRepository.findByStatus(MatchmakingRequestStatus.COMPLETED)
            .filter { it.updatedAt >= seasonStartDateTime }
            .let { reqs ->
                if (exposeSeed) reqs
                else reqs.filter { !seedUserPolicy.isSeed(it.matchmakerId) }
            }

        // 주선자별 성공 횟수
        val matchmakerCounts = allCompleted
            .groupBy { it.matchmakerId }
            .mapValues { (_, reqs) -> reqs.size }

        // 랭킹 생성
        val rankings = matchmakerCounts.entries
            .sortedByDescending { it.value }
            .mapIndexedNotNull { idx, (matchmakerId, count) ->
                val user = userRepository.findById(matchmakerId) ?: return@mapIndexedNotNull null
                val tier = LeagueTier.fromMatches(count)
                LeagueRankEntry(
                    rank = idx + 1,
                    userId = matchmakerId.value.toString(),
                    nickname = user.publicInfo.nickname,
                    successCount = count,
                    tier = tier.label,
                    tierEmoji = tier.emoji,
                    tierColor = tier.color,
                    isMe = matchmakerId == myId
                )
            }

        val myCount = matchmakerCounts[myId] ?: 0
        val myTier = LeagueTier.fromMatches(myCount)
        val myRank = rankings.find { it.isMe }?.rank

        // 내가 랭킹에 없으면 0점으로 표시되도록 처리
        val displayRankings = if (rankings.size >= 10) {
            rankings.take(10)
        } else {
            rankings
        }

        return ResponseEntity.ok(
            LeagueResponse(
                season = SeasonInfo(
                    seasonName = "${today.year}년 ${today.monthValue}월 큐피드 리그",
                    startDate = seasonStart.toString(),
                    endDate = seasonEnd.toString(),
                    daysRemaining = daysRemaining
                ),
                myRank = myRank,
                mySuccessCount = myCount,
                myTier = myTier.label,
                myTierEmoji = myTier.emoji,
                myTierColor = myTier.color,
                topRankers = displayRankings,
                totalParticipants = matchmakerCounts.size
            )
        )
    }
}
