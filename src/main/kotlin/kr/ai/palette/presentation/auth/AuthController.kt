package kr.ai.palette.presentation.auth

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.auth.AuthenticationService
import kr.ai.palette.domain.user.PrivateInfo
import kr.ai.palette.domain.user.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authenticationService: AuthenticationService,
    private val userRepository: UserRepository
) {

    @PostMapping("/refresh")
    fun refreshToken(@RequestBody request: RefreshTokenRequest): ResponseEntity<TokenResponse> {
        val authToken = authenticationService.refreshToken(request.refreshToken)

        return ResponseEntity.ok(
            TokenResponse(
                accessToken = authToken.accessToken,
                refreshToken = authToken.refreshToken,
                tokenType = authToken.tokenType,
                expiresIn = (authToken.expiresAt.epochSecond - java.time.Instant.now().epochSecond).toInt()
            )
        )
    }

    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<UserResponse> {
        return ResponseEntity.ok(
            UserResponse(
                userId = authUser.userId.value.toString(),
                nickname = authUser.nickname,
                accountType = authUser.accountType.name,
                isProfileCompleted = authUser.isProfileCompleted,
                canAccessMatchingService = authUser.canAccessMatchingService(),
                canAccessMatchmakerService = authUser.canAccessMatchmakerService()
            )
        )
    }

    @PostMapping("/logout")
    fun logout(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<Unit> {
        authenticationService.logout(authUser.userId)
        return ResponseEntity.ok().build()
    }

    @PatchMapping("/basic-info")
    @Transactional
    fun updateBasicInfo(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: UpdateBasicInfoRequest
    ): ResponseEntity<Unit> {
        val user = userRepository.findById(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        // PrivateInfo 업데이트
        val updatedPrivateInfo = user.privateInfo.copy(
            realName = request.realName ?: user.privateInfo.realName,
            email = request.email ?: user.privateInfo.email
        )

        val updatedUser = user.updatePrivateInfo(updatedPrivateInfo)
        userRepository.save(updatedUser)

        return ResponseEntity.ok().build()
    }
}

data class RefreshTokenRequest(
    val refreshToken: String
)

data class TokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String,
    val expiresIn: Int
)

data class UserResponse(
    val userId: String,
    val nickname: String,
    val accountType: String,
    val isProfileCompleted: Boolean,
    val canAccessMatchingService: Boolean,
    val canAccessMatchmakerService: Boolean
)

data class UpdateBasicInfoRequest(
    val realName: String?,
    val email: String?
)
