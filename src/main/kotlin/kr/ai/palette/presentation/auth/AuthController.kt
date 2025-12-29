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
    private val passwordEncoder: PasswordEncoder,
    private val matchmakerRepository: kr.ai.palette.domain.matchmaker.MatchmakerRepository
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
                gender = user.publicInfo.gender.name,
                phoneNumber = user.privateInfo.phoneNumber
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

    @PutMapping("/matchmaker/complete-info")
    @Transactional
    fun completeMatchmakerInfo(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: CompleteMatchmakerInfoRequest
    ): ResponseEntity<Unit> {
        // TODO: 핸드폰 인증 코드 검증

        val user = userRepository.findById(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        // 닉네임 중복 체크 (기존 닉네임과 다른 경우만)
        if (request.nickname != user.publicInfo.nickname &&
            userRepository.existsByNickname(request.nickname)) {
            return ResponseEntity.badRequest().build()
        }

        // 핸드폰 번호 중복 체크 (기존 번호와 다른 경우만)
        if (request.phoneNumber != user.privateInfo.phoneNumber &&
            userRepository.existsByPhoneNumber(request.phoneNumber)) {
            return ResponseEntity.badRequest().build()
        }

        // 사용자 정보 업데이트
        val updatedUser = user.copy(
            publicInfo = user.publicInfo.copy(nickname = request.nickname),
            privateInfo = user.privateInfo.copy(
                phoneNumber = request.phoneNumber,
                isPhoneVerified = true
            )
        )

        userRepository.save(updatedUser)

        // Matchmaker 생성 (아직 없는 경우만)
        if (!matchmakerRepository.existsByUserId(authUser.userId)) {
            val now = Instant.now()
            val matchmaker = kr.ai.palette.domain.matchmaker.Matchmaker(
                id = kr.ai.palette.domain.matchmaker.MatchmakerId(UUID.randomUUID()),
                userId = authUser.userId,
                stats = kr.ai.palette.domain.matchmaker.MatchmakerStats.initial(),
                level = kr.ai.palette.domain.matchmaker.MatchmakerLevel.initial(),
                earnings = kr.ai.palette.domain.matchmaker.MatchmakerEarnings.initial(),
                profilePhoto = null,
                metadata = kr.ai.palette.domain.matchmaker.MatchmakerMetadata(
                    createdAt = now,
                    updatedAt = now
                )
            )
            matchmakerRepository.save(matchmaker)
        }

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

        // 닉네임 중복 체크 (변경하는 경우만)
        if (request.nickname != null && request.nickname != user.publicInfo.nickname) {
            if (userRepository.existsByNickname(request.nickname)) {
                return ResponseEntity.badRequest().build()
            }
        }

        // PrivateInfo 업데이트
        val updatedPrivateInfo = user.privateInfo.copy(
            realName = request.realName ?: user.privateInfo.realName,
            email = request.email ?: user.privateInfo.email
        )

        // PublicInfo 업데이트 (닉네임 포함)
        val updatedPublicInfo = user.publicInfo.copy(
            nickname = request.nickname ?: user.publicInfo.nickname
        )

        val updatedUser = user.copy(
            privateInfo = updatedPrivateInfo,
            publicInfo = updatedPublicInfo
        )
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
    val gender: String,
    val phoneNumber: String?
)

data class UpdateBasicInfoRequest(
    val realName: String?,
    val email: String?,
    val nickname: String?
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

data class MatchmakerSignupRequest(
    val email: String,
    val password: String,
    val realName: String,
    val nickname: String,
    val phoneNumber: String,
    val birthDate: LocalDate,
    val gender: Gender,
    val verificationCode: String  // 핸드폰 인증 코드
)

data class CompleteMatchmakerInfoRequest(
    val nickname: String,
    val phoneNumber: String,
    val verificationCode: String
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
                phoneNumber = null,
                contactInfo = null
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

    @PostMapping("/matchmaker/signup")
    @Transactional
    fun matchmakerSignup(@RequestBody request: MatchmakerSignupRequest): ResponseEntity<TokenResponse> {
        // TODO: 핸드폰 인증 코드 검증 로직 추가 필요
        // For now, we'll skip actual verification and just mark as verified

        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.email)) {
            return ResponseEntity.badRequest().build()
        }

        // 닉네임 중복 체크
        if (userRepository.existsByNickname(request.nickname)) {
            return ResponseEntity.badRequest().build()
        }

        // 핸드폰 번호 중복 체크
        if (userRepository.existsByPhoneNumber(request.phoneNumber)) {
            return ResponseEntity.badRequest().build()
        }

        val now = Instant.now()

        // 주선자 계정 생성 (핸드폰 인증 완료 상태로)
        val user = User(
            id = UserId(UUID.randomUUID()),
            oauthInfo = null,
            password = passwordEncoder.encode(request.password),
            privateInfo = PrivateInfo(
                realName = request.realName,
                email = request.email,
                phoneNumber = request.phoneNumber,
                isPhoneVerified = true,  // 인증 코드 검증 후 true로 설정
                contactInfo = ContactInfo(
                    phoneNumber = request.phoneNumber,
                    kakaoTalkId = null,
                    preferredContactMethod = null
                )
            ),
            publicInfo = PublicInfo(
                nickname = request.nickname,
                birthDate = request.birthDate,
                gender = request.gender
            ),
            accountType = AccountType.MATCHMAKER_ONLY,  // 주선자 전용 계정
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
