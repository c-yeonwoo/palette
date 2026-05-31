package kr.ai.palette.presentation.admin

import kr.ai.palette.domain.auth.TokenProvider
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.domain.user.UserRole
import kr.ai.palette.infrastructure.exception.BusinessRuleViolationException
import org.springframework.http.ResponseEntity
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

/**
 * 운영자 전용 로그인. 일반 사용자 로그인과 의도적으로 분리.
 *
 * - role=ADMIN 인 사용자만 통과
 * - 일반 사용자가 이 endpoint 로 로그인 시도하면 명시적 403 (실수 방지 + audit 단서)
 * - 일반 로그인 (`/api/v1/auth/email/login`) 에서는 ADMIN 도 받아들이지만 admin 권한은 그대로 — 둘 다 같은 JWT 발급
 *   (admin 권한은 토큰 자체가 아니라 user.role 에 결정됨)
 *
 * ADR: docs/DECISIONS/0006-admin-role-and-auth.md
 */
@RestController
@RequestMapping("/api/v1/admin/auth")
class AdminAuthController(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val tokenProvider: TokenProvider,
) {

    @PostMapping("/login")
    fun login(@RequestBody request: AdminLoginRequest): ResponseEntity<AdminLoginResponse> {
        val user = userRepository.findByEmail(request.email)
            ?: throw BusinessRuleViolationException("운영자 계정을 찾을 수 없습니다")

        if (user.password == null || !passwordEncoder.matches(request.password, user.password)) {
            throw BusinessRuleViolationException("비밀번호가 올바르지 않습니다")
        }

        if (user.role != UserRole.ADMIN) {
            throw BusinessRuleViolationException("운영자 권한이 없습니다")
        }

        if (user.metadata.isDeleted()) {
            throw BusinessRuleViolationException("탈퇴한 계정입니다")
        }

        val accessToken = tokenProvider.generateAccessToken(user.id)
        val refreshToken = tokenProvider.generateRefreshToken(user.id)

        // 로그인 시각 갱신
        userRepository.save(user.updateLogin())

        return ResponseEntity.ok(
            AdminLoginResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                tokenType = "Bearer",
                expiresIn = 3600,
                admin = AdminInfo(
                    userId = user.id.value.toString(),
                    email = user.privateInfo.email ?: "",
                    nickname = user.publicInfo.nickname,
                    lastLoginAt = Instant.now().toString(),
                ),
            )
        )
    }
}

data class AdminLoginRequest(
    val email: String,
    val password: String,
)

data class AdminLoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String,
    val expiresIn: Int,
    val admin: AdminInfo,
)

data class AdminInfo(
    val userId: String,
    val email: String,
    val nickname: String,
    val lastLoginAt: String,
)
