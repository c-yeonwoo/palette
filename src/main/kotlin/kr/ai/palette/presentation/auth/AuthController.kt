package kr.ai.palette.presentation.auth

import kr.ai.palette.domain.auth.AuthToken
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.auth.AuthenticationService
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.*
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.LocalDate
import java.util.*

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authenticationService: AuthenticationService,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
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
        val user = userRepository.findById(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(
            UserResponse(
                userId = authUser.userId.value.toString(),
                nickname = authUser.nickname,
                accountType = authUser.accountType.name,
                isProfileCompleted = authUser.isProfileCompleted,
                canAccessMatchingService = authUser.canAccessMatchingService(),
                canAccessMatchmakerService = authUser.canAccessMatchmakerService(),
                realName = user.privateInfo.realName,
                birthDate = user.publicInfo.birthDate.toString(),
                gender = user.publicInfo.gender.name
            )
        )
    }

    @PostMapping("/logout")
    fun logout(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<Unit> {
        authenticationService.logout(authUser.userId)
        return ResponseEntity.ok().build()
    }

    @PatchMapping("/convert-to-regular")
    @Transactional
    fun convertToRegular(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<Unit> {
        println("🔄 Convert to regular request received for user: ${authUser.userId.value}")

        val user = userRepository.findById(authUser.userId)
        if (user == null) {
            println("❌ User not found: ${authUser.userId.value}")
            return ResponseEntity.notFound().build()
        }

        println("✅ User found: ${user.publicInfo.nickname}, accountType: ${user.accountType}")

        // MATCHMAKER_ONLY를 REGULAR로 변경
        if (user.accountType != AccountType.MATCHMAKER_ONLY) {
            println("❌ User is not MATCHMAKER_ONLY, current type: ${user.accountType}")
            return ResponseEntity.badRequest().build()
        }

        println("🔄 Converting user to REGULAR...")

        val updatedUser = User(
            id = user.id,
            oauthInfo = user.oauthInfo,
            password = user.password,
            privateInfo = user.privateInfo,
            publicInfo = user.publicInfo,
            accountType = AccountType.REGULAR,
            isProfileCompleted = false, // 프로필 작성 필요
            termsAgreement = user.termsAgreement,
            metadata = UserMetadata(
                createdAt = user.metadata.createdAt,
                updatedAt = Instant.now(),
                lastLoginAt = user.metadata.lastLoginAt,
                deletedAt = user.metadata.deletedAt
            )
        )

        userRepository.save(updatedUser)
        println("✅ User converted successfully to REGULAR")
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

    @PatchMapping("/account-type")
    @Transactional
    fun updateAccountType(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: UpdateAccountTypeRequest
    ): ResponseEntity<Unit> {
        val user = userRepository.findById(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        // AccountType 업데이트
        val updatedUser = user.copy(accountType = request.accountType)
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
    val canAccessMatchmakerService: Boolean,
    val realName: String,
    val birthDate: String,
    val gender: String
)

data class UpdateBasicInfoRequest(
    val realName: String?,
    val email: String?
)

data class UpdateAccountTypeRequest(
    val accountType: AccountType
)

data class EmailSignupRequest(
    val email: String,
    val password: String,
    val realName: String,
    val nickname: String,
    val birthDate: LocalDate,
    val gender: Gender
)

data class EmailLoginRequest(
    val email: String,
    val password: String
)

@RestController
@RequestMapping("/api/v1/auth/email")
class EmailAuthController(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val tokenProvider: kr.ai.palette.domain.auth.TokenProvider
) {

    @PostMapping("/signup")
    @Transactional
    fun signup(@RequestBody request: EmailSignupRequest): ResponseEntity<TokenResponse> {
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.email)) {
            return ResponseEntity.badRequest().build()
        }

        // 닉네임 중복 체크
        if (userRepository.existsByNickname(request.nickname)) {
            return ResponseEntity.badRequest().build()
        }

        val now = Instant.now()

        // 사용자 생성
        val user = User(
            id = UserId(UUID.randomUUID()),
            oauthInfo = null,  // 이메일 회원은 OAuth 정보 없음
            password = passwordEncoder.encode(request.password),
            privateInfo = PrivateInfo(
                realName = request.realName,
                email = request.email,
                phoneNumber = null
            ),
            publicInfo = PublicInfo(
                nickname = request.nickname,
                birthDate = request.birthDate,
                gender = request.gender
            ),
            accountType = AccountType.REGULAR,
            isProfileCompleted = false,
            termsAgreement = TermsAgreement(
                agreedTermsService = true,
                agreedTermsPrivacy = true,
                agreedMarketing = false,
                agreedAt = now
            ),
            metadata = UserMetadata(
                createdAt = now,
                updatedAt = now,
                lastLoginAt = now
            )
        )

        val savedUser = userRepository.save(user)

        // JWT 토큰 생성
        val authToken = AuthToken.create(
            accessToken = generateAccessToken(savedUser.id),
            refreshToken = generateRefreshToken(savedUser.id)
        )

        return ResponseEntity.ok(
            TokenResponse(
                accessToken = authToken.accessToken,
                refreshToken = authToken.refreshToken,
                tokenType = authToken.tokenType,
                expiresIn = (authToken.expiresAt.epochSecond - Instant.now().epochSecond).toInt()
            )
        )
    }

    @PostMapping("/login")
    @Transactional
    fun login(@RequestBody request: EmailLoginRequest): ResponseEntity<TokenResponse> {
        // 이메일로 사용자 찾기
        val user = userRepository.findByEmail(request.email)
            ?: return ResponseEntity.status(401).build()

        // 비밀번호 확인
        if (user.password == null || !passwordEncoder.matches(request.password, user.password)) {
            return ResponseEntity.status(401).build()
        }

        // 로그인 시간 업데이트
        val updatedUser = user.updateLogin()
        userRepository.save(updatedUser)

        // JWT 토큰 생성
        val authToken = AuthToken.create(
            accessToken = generateAccessToken(user.id),
            refreshToken = generateRefreshToken(user.id)
        )

        return ResponseEntity.ok(
            TokenResponse(
                accessToken = authToken.accessToken,
                refreshToken = authToken.refreshToken,
                tokenType = authToken.tokenType,
                expiresIn = (authToken.expiresAt.epochSecond - Instant.now().epochSecond).toInt()
            )
        )
    }

    private fun generateAccessToken(userId: UserId): String {
        return tokenProvider.generateAccessToken(userId)
    }

    private fun generateRefreshToken(userId: UserId): String {
        return tokenProvider.generateRefreshToken(userId)
    }
}
