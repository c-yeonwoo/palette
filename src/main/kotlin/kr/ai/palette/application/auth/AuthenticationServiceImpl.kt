package kr.ai.palette.application.auth

import kr.ai.palette.domain.auth.*
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.util.*

@Service
@Transactional
class AuthenticationServiceImpl(
    private val userRepository: UserRepository,
    private val tokenProvider: TokenProvider,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val betaCodeValidator: kr.ai.palette.infrastructure.beta.BetaCodeValidator,
    private val welcomeBonusService: kr.ai.palette.application.billing.WelcomeBonusService,
) : AuthenticationService {

    override fun authenticateOAuth(oauthUserInfo: OAuthUserInfo, betaCode: String?): AuthenticationResult {
        return try {
            // 기존 사용자 조회
            val existingUser = userRepository.findByOAuthInfo(
                provider = oauthUserInfo.provider,
                oauthId = oauthUserInfo.providerId
            )

            val isNewSignup = existingUser == null
            val user = if (existingUser != null) {
                // 기존 사용자: 마지막 로그인 업데이트
                existingUser.updateLogin()
            } else {
                // 신규 OAuth 가입: body 코드 또는 베타 쿠키
                if (!betaCodeValidator.validateCodeOrCookie(betaCode)) {
                    throw kr.ai.palette.infrastructure.beta.InvalidBetaCodeException()
                }
                createNewUser(oauthUserInfo)
            }

            // 사용자 저장
            val savedUser = userRepository.save(user)

            // 신규 가입 시 환영 보너스 — 7일 무료 체험 (ADR 0041, B-001)
            if (isNewSignup) {
                runCatching {
                    welcomeBonusService.grantSignupBonus(savedUser.id.value.toString())
                }.onFailure { e ->
                    // 보너스 지급 실패는 가입 자체를 막지 않음 — 로그만
                    org.slf4j.LoggerFactory.getLogger(AuthenticationServiceImpl::class.java)
                        .warn("가입 보너스 지급 실패 user={} error={}", savedUser.id.value, e.message)
                }
            }

            // 누락된 필수 정보 체크
            val missingFields = checkMissingRequiredFields(oauthUserInfo)

            // 토큰 생성
            val authToken = createAuthToken(savedUser.id)

            // AuthUser 생성
            val authUser = AuthUser(
                userId = savedUser.id,
                nickname = savedUser.publicInfo.nickname,
                accountType = savedUser.accountType,
                isProfileCompleted = savedUser.isProfileCompleted
            )

            AuthenticationResult.Success(
                authToken = authToken,
                authUser = authUser,
                isNewUser = existingUser == null,
                missingRequiredFields = missingFields
            )
        } catch (e: kr.ai.palette.infrastructure.beta.InvalidBetaCodeException) {
            // 베타 게이트 실패는 그대로 throw → OAuth FailureHandler에서 별도 처리
            throw e
        } catch (e: Exception) {
            AuthenticationResult.Failure(
                reason = AuthenticationFailureReason.NETWORK_ERROR
            )
        }
    }

    override fun refreshToken(refreshToken: String): AuthToken {
        // Refresh Token 검증
        if (!tokenProvider.validateToken(refreshToken)) {
            throw IllegalArgumentException("Invalid refresh token")
        }

        // UserId 추출
        val userId = tokenProvider.extractUserId(refreshToken)
            ?: throw IllegalArgumentException("Cannot extract userId from refresh token")

        // 사용자 존재 여부 확인
        val user = userRepository.findById(userId)
            ?: throw IllegalArgumentException("User not found")

        // 저장된 refresh token과 일치하는지 검증
        if (!refreshTokenRepository.isValid(userId, refreshToken)) {
            throw IllegalArgumentException("Refresh token mismatch or already invalidated")
        }

        // 새로운 토큰 생성
        return createAuthToken(user.id)
    }

    @Transactional(readOnly = true)
    override fun validateToken(accessToken: String): AuthUser {
        // Token 검증
        if (!tokenProvider.validateToken(accessToken)) {
            throw IllegalArgumentException("Invalid access token")
        }

        // UserId 추출
        val userId = tokenProvider.extractUserId(accessToken)
            ?: throw IllegalArgumentException("Cannot extract userId from access token")

        // 사용자 조회
        val user = userRepository.findById(userId)
            ?: throw IllegalArgumentException("User not found")

        // AuthUser 반환
        return AuthUser(
            userId = user.id,
            nickname = user.publicInfo.nickname,
            accountType = user.accountType,
            isProfileCompleted = user.isProfileCompleted,
            role = user.role,
        )
    }

    override fun logout(userId: UserId) {
        refreshTokenRepository.deleteByUserId(userId)
    }

    private fun createNewUser(oauthUserInfo: OAuthUserInfo): User {
        val now = Instant.now()

        // 실명/생년월일/성별은 NICE 본인인증 후 업데이트됨.
        // 비즈니스 앱 심사 전 카카오는 이 정보를 제공하지 않으므로 임시값으로 계정 생성.
        val realName = oauthUserInfo.realName ?: (oauthUserInfo.name ?: "미인증")
        val birthDate = oauthUserInfo.birthDate ?: java.time.LocalDate.of(1990, 1, 1)
        val gender = when (oauthUserInfo.gender?.lowercase()) {
            "male" -> Gender.MALE
            "female" -> Gender.FEMALE
            else -> Gender.MALE  // NICE 인증 완료 전 임시값 — NICE 완료 후 덮어씀
        }

        return User(
            id = UserId(UUID.randomUUID()),
            oauthInfo = OAuthInfo(
                provider = oauthUserInfo.provider,
                oauthId = oauthUserInfo.providerId
            ),
            password = null,  // OAuth users don't have password
            privateInfo = PrivateInfo(
                realName = realName,
                email = oauthUserInfo.email,
                phoneNumber = null,
                isPhoneVerified = false,
                contactInfo = null
            ),
            publicInfo = PublicInfo(
                nickname = generateNickname(),
                birthDate = birthDate,
                gender = gender
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
    }

    private fun createAuthToken(userId: UserId): AuthToken {
        val accessToken = tokenProvider.generateAccessToken(userId)
        val refreshToken = tokenProvider.generateRefreshToken(userId)

        refreshTokenRepository.save(userId, refreshToken, tokenProvider.refreshTokenExpirySeconds())

        return AuthToken.create(
            accessToken = accessToken,
            refreshToken = refreshToken
        )
    }

    private fun generateNickname(): String {
        // 임시 닉네임 생성 (나중에 중복 체크 및 사용자 지정으로 변경)
        return "user_${UUID.randomUUID().toString().substring(0, 8)}"
    }

    private fun checkMissingRequiredFields(oauthUserInfo: OAuthUserInfo): List<String> {
        val missingFields = mutableListOf<String>()

        // 실명 체크 (필수)
        if (oauthUserInfo.realName.isNullOrBlank()) {
            missingFields.add("realName")
        }

        // 생년월일 체크 (필수)
        if (oauthUserInfo.birthDate == null) {
            missingFields.add("birthDate")
        }

        // 성별 체크 (필수)
        if (oauthUserInfo.gender.isNullOrBlank()) {
            missingFields.add("gender")
        }

        // 이메일이 없는 경우 (선택사항이지만 받을 수 있으면 받기)
        if (oauthUserInfo.email.isNullOrBlank()) {
            missingFields.add("email")
        }

        return missingFields
    }
}
