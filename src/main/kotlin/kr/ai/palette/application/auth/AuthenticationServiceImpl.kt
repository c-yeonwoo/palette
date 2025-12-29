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
    private val tokenProvider: TokenProvider
) : AuthenticationService {

    override fun authenticateOAuth(oauthUserInfo: OAuthUserInfo): AuthenticationResult {
        return try {
            // 기존 사용자 조회
            val existingUser = userRepository.findByOAuthInfo(
                provider = oauthUserInfo.provider,
                oauthId = oauthUserInfo.providerId
            )

            val user = if (existingUser != null) {
                // 기존 사용자: 마지막 로그인 업데이트
                existingUser.updateLogin()
            } else {
                // 신규 사용자: 자동 회원가입
                createNewUser(oauthUserInfo)
            }

            // 사용자 저장
            val savedUser = userRepository.save(user)

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
            isProfileCompleted = user.isProfileCompleted
        )
    }

    override fun logout(userId: UserId) {
        // TODO: Refresh Token을 Redis에 저장하고 있다면 삭제
        // 현재는 JWT stateless 방식이므로 클라이언트에서 토큰 삭제로 처리
    }

    private fun createNewUser(oauthUserInfo: OAuthUserInfo): User {
        val now = Instant.now()

        // 실명과 생년월일이 필수
        val realName = oauthUserInfo.realName
            ?: throw IllegalArgumentException("Real name is required for OAuth registration")
        val birthDate = oauthUserInfo.birthDate
            ?: throw IllegalArgumentException("Birth date is required for OAuth registration")

        // 성별 변환 (카카오: male/female -> Gender enum)
        val gender = when (oauthUserInfo.gender?.lowercase()) {
            "male" -> Gender.MALE
            "female" -> Gender.FEMALE
            else -> throw IllegalArgumentException("Gender is required for OAuth registration")
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
