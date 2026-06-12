package kr.ai.palette.presentation.admin

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.persistence.relationship.PostMatchFeedbackJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * 운영자 — 만남 후 피드백 모니터링 (ADR 0050, 안전망).
 *
 * 목적: 반복 'DISAPPOINTING' 수신 / 노쇼(NOT_MET) 누적 패턴 감지 → T&S 선제 대응.
 * 개별 후기 원문은 운영자도 신중히 — 집계 우선 노출.
 *
 * admin API 는 SecurityConfig 에서 hasRole(ADMIN) 강제.
 */
@RestController
@RequestMapping("/api/v1/admin/match-feedback")
class AdminMatchFeedbackController(
    private val feedbackRepository: PostMatchFeedbackJpaRepository,
    private val userRepository: UserRepository,
) {

    /**
     * 사용자별 '받은 피드백' 집계 — 플래그 우선순위 정렬.
     *
     * @param minNegative 최소 부정(DISAPPOINTING) 또는 노쇼 횟수 (기본 1 — 1건 이상 받은 사람만)
     */
    @GetMapping("/flags")
    fun flags(
        @RequestParam(required = false, defaultValue = "1") minNegative: Int,
    ): ResponseEntity<MatchFeedbackFlagsResponse> {
        val all = feedbackRepository.findAll()

        // counterpart(= 후기 받은 사람) 기준 집계
        val byCounterpart = all.groupBy { it.counterpartUserId }

        val flags = byCounterpart.mapNotNull { (uid, list) ->
            val disappointing = list.count { it.sentiment == "DISAPPOINTING" }
            val noShow = list.count { it.metStatus == "NOT_MET" }
            val negativeScore = disappointing + noShow
            if (negativeScore < minNegative) return@mapNotNull null
            val user = userRepository.findById(UserId(uid))
            UserFeedbackFlag(
                userId = uid.toString(),
                nickname = user?.publicInfo?.nickname ?: "회원",
                realName = user?.privateInfo?.realName ?: "—",
                totalReceived = list.size,
                disappointing = disappointing,
                noShow = noShow,
                good = list.count { it.sentiment == "GOOD" },
            )
        }.sortedByDescending { it.disappointing + it.noShow }

        return ResponseEntity.ok(
            MatchFeedbackFlagsResponse(
                totalFeedbacks = all.size,
                flaggedUsers = flags.size,
                flags = flags,
            )
        )
    }
}

data class MatchFeedbackFlagsResponse(
    val totalFeedbacks: Int,
    val flaggedUsers: Int,
    val flags: List<UserFeedbackFlag>,
)

data class UserFeedbackFlag(
    val userId: String,
    val nickname: String,
    val realName: String,
    val totalReceived: Int,
    val disappointing: Int,
    val noShow: Int,
    val good: Int,
)
