package kr.ai.palette.presentation.safety

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.persistence.safety.BlockEntity
import kr.ai.palette.persistence.safety.BlockJpaRepository
import kr.ai.palette.persistence.safety.ReportEntity
import kr.ai.palette.persistence.safety.ReportJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * 유저간 차단/신고 (어뷰징 방지 — ADR 0023).
 * 차단은 양방향 격리(BlockService 가 피드/AI시그널/매칭/검색에서 제외).
 */
@RestController
@RequestMapping("/api/v1/users")
class BlockReportController(
    private val blockJpaRepository: BlockJpaRepository,
    private val reportJpaRepository: ReportJpaRepository,
    private val userRepository: UserRepository,
) {
    private val validReasons = setOf("FAKE_PROFILE", "HARASSMENT", "SPAM", "MINOR", "EXTERNAL_PAYMENT_INDUCEMENT", "OTHER")

    @PostMapping("/{userId}/block")
    @Transactional
    fun block(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable userId: UUID
    ): ResponseEntity<Map<String, Any?>> {
        val me = authUser.userId.value
        if (me == userId) {
            return ResponseEntity.badRequest().body(mapOf("error" to "자기 자신은 차단할 수 없습니다"))
        }
        if (userRepository.findById(UserId(userId)) == null) {
            return ResponseEntity.badRequest().body(mapOf("error" to "존재하지 않는 사용자입니다"))
        }
        if (!blockJpaRepository.existsByBlockerUserIdAndBlockedUserId(me, userId)) {
            blockJpaRepository.save(BlockEntity(id = UUID.randomUUID(), blockerUserId = me, blockedUserId = userId))
        }
        return ResponseEntity.ok(mapOf("success" to true, "blockedUserId" to userId.toString()))
    }

    @DeleteMapping("/{userId}/block")
    @Transactional
    fun unblock(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable userId: UUID
    ): ResponseEntity<Map<String, Any?>> {
        blockJpaRepository.deleteByBlockerUserIdAndBlockedUserId(authUser.userId.value, userId)
        return ResponseEntity.ok(mapOf("success" to true))
    }

    @GetMapping("/me/blocks")
    fun myBlocks(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<List<Map<String, Any?>>> {
        val list = blockJpaRepository.findByBlockerUserId(authUser.userId.value).map {
            mapOf("blockedUserId" to it.blockedUserId.toString(), "createdAt" to it.createdAt.toString())
        }
        return ResponseEntity.ok(list)
    }

    @PostMapping("/{userId}/report")
    @Transactional
    fun report(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable userId: UUID,
        @RequestBody request: ReportUserRequest
    ): ResponseEntity<Map<String, Any?>> {
        val me = authUser.userId.value
        if (me == userId) {
            return ResponseEntity.badRequest().body(mapOf("error" to "자기 자신은 신고할 수 없습니다"))
        }
        val reason = request.reason.uppercase()
        if (reason !in validReasons) {
            return ResponseEntity.badRequest().body(mapOf("error" to "유효하지 않은 신고 사유입니다"))
        }
        if (reportJpaRepository.existsByReporterUserIdAndReportedUserId(me, userId)) {
            return ResponseEntity.ok(mapOf("success" to true, "message" to "이미 신고가 접수되었습니다"))
        }
        reportJpaRepository.save(
            ReportEntity(
                id = UUID.randomUUID(),
                reporterUserId = me,
                reportedUserId = userId,
                reason = reason,
                detail = request.detail,
            )
        )
        return ResponseEntity.ok(mapOf("success" to true, "message" to "신고가 접수되었습니다"))
    }
}

data class ReportUserRequest(val reason: String, val detail: String?)
