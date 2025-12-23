package kr.ai.palette.presentation.matchmaker

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.matchmaker.*
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.net.URI
import java.time.Instant
import java.util.*

@RestController
@RequestMapping("/api/v1/matchmakers")
class MatchmakerController(
    private val matchmakerRepository: MatchmakerRepository
) {

    @PostMapping
    @Transactional
    fun createMatchmaker(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<MatchmakerResponse> {
        // 이미 Matchmaker가 존재하는지 확인
        if (matchmakerRepository.existsByUserId(authUser.userId)) {
            return ResponseEntity.badRequest().build()
        }

        // Matchmaker 생성
        val now = Instant.now()
        val matchmaker = Matchmaker(
            id = MatchmakerId(UUID.randomUUID()),
            userId = authUser.userId,
            stats = MatchmakerStats.initial(),
            level = MatchmakerLevel.initial(),
            earnings = MatchmakerEarnings.initial(),
            profilePhoto = null,
            metadata = MatchmakerMetadata(
                createdAt = now,
                updatedAt = now
            )
        )

        val savedMatchmaker = matchmakerRepository.save(matchmaker)

        return ResponseEntity.created(
            URI.create("/api/v1/matchmakers/${savedMatchmaker.id.value}")
        ).body(
            MatchmakerResponse(
                matchmakerId = savedMatchmaker.id.value.toString(),
                userId = savedMatchmaker.userId.value.toString(),
                level = savedMatchmaker.level.level,
                commissionRate = savedMatchmaker.level.commissionRate,
                totalPoints = savedMatchmaker.earnings.totalPoints,
                successfulMatches = savedMatchmaker.stats.successfulMatches,
                createdAt = savedMatchmaker.metadata.createdAt
            )
        )
    }

    @GetMapping("/me")
    fun getMyMatchmaker(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<MatchmakerResponse> {
        val matchmaker = matchmakerRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(
            MatchmakerResponse(
                matchmakerId = matchmaker.id.value.toString(),
                userId = matchmaker.userId.value.toString(),
                level = matchmaker.level.level,
                commissionRate = matchmaker.level.commissionRate,
                totalPoints = matchmaker.earnings.totalPoints,
                successfulMatches = matchmaker.stats.successfulMatches,
                createdAt = matchmaker.metadata.createdAt
            )
        )
    }
}

data class MatchmakerResponse(
    val matchmakerId: String,
    val userId: String,
    val level: Int,
    val commissionRate: Double,
    val totalPoints: Int,
    val successfulMatches: Int,
    val createdAt: Instant
)
