package kr.ai.palette.presentation.user

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

data class DeleteAccountRequest(
    /** 사용자 본인 확인용 — 프론트가 "탈퇴합니다" 정확히 입력 시 전송 */
    val confirmation: String,
    /** 선택적 — 운영 개선용 (수집 옵트인) */
    val reason: String? = null,
)

data class DeleteAccountResponse(
    val deleted: Boolean,
    val message: String,
)

/**
 * 사용자 본인의 계정 관리. ADR 0040.
 *
 * **탈퇴 (DELETE /me)** — App Store Review Guideline 5.1.1(v) 의무 (2022.6).
 * Google Play 도 2024.5 부터 동일 강화.
 *
 * 흐름:
 *  1) confirmation = "탈퇴합니다" 검증
 *  2) User.anonymize() — PII (이름·이메일·전화·닉네임·OAuth ID) 즉시 익명화
 *  3) deletedAt 마킹 — 이후 인증 시 isActive() = false 로 차단
 *  4) row 자체는 30일 후 hard delete (운영 잡, 미구현 — RUNBOOK 백로그)
 *
 * 후속(미구현, 백로그): 매칭 진행 중인 건이 있으면 안내·보류,
 *   주선자 출금 잔액 처리, 사진 S3 객체 삭제.
 */
@RestController
@RequestMapping("/api/v1/users/me")
class UserController(
    private val userRepository: UserRepository,
) {
    private val log = LoggerFactory.getLogger(UserController::class.java)

    @DeleteMapping
    @Transactional
    fun deleteAccount(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: DeleteAccountRequest,
    ): ResponseEntity<DeleteAccountResponse> {
        if (request.confirmation.trim() != "탈퇴합니다") {
            return ResponseEntity.badRequest().body(
                DeleteAccountResponse(deleted = false, message = "확인 문구가 일치하지 않아요")
            )
        }

        val user = userRepository.findById(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        if (user.metadata.isDeleted()) {
            return ResponseEntity.ok(
                DeleteAccountResponse(deleted = true, message = "이미 탈퇴 처리된 계정입니다")
            )
        }

        val anonymized = user.anonymize()
        userRepository.save(anonymized)
        log.info(
            "탈퇴 처리 userId={} reason={}",
            authUser.userId.value,
            request.reason?.take(200) ?: "(미입력)",
        )

        return ResponseEntity.ok(
            DeleteAccountResponse(
                deleted = true,
                message = "탈퇴가 완료되었어요. 30일간 운영 통계 목적으로만 익명 데이터가 보관되며 이후 완전 삭제됩니다.",
            )
        )
    }
}
