package kr.ai.palette.presentation.auth

import kr.ai.palette.domain.auth.AuthenticationResult
import kr.ai.palette.domain.auth.AuthenticationService
import kr.ai.palette.domain.auth.OAuthUserInfo
import kr.ai.palette.domain.user.OAuthProvider
import kr.ai.palette.infrastructure.beta.InvalidBetaCodeException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator
import org.springframework.security.oauth2.core.OAuth2Error
import org.springframework.security.oauth2.core.OAuth2TokenValidator
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.jwt.JwtException
import org.springframework.security.oauth2.jwt.JwtValidators
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

data class AppleSignInRequest(
    /** Capacitor Apple Sign-In SDK 가 발급한 identityToken (RS256 JWT). */
    val identityToken: String,
    /** authorizationCode — refresh 토큰 발급용 (현재 네이티브 검증에는 미사용). */
    val authorizationCode: String? = null,
    /** 사용자가 첫 가입 시 제공하는 이름 (Apple 은 첫 가입 1회만 노출). */
    val displayName: String? = null,
    /**
     * 베타 게이트 코드 — 네이티브는 cross-origin 쿠키가 안 실 수 있어 body로 전달.
     * 쿠키와 OR 검증 ([BetaCodeValidator.validateCodeOrCookie]).
     */
    val betaCode: String? = null,
)

/**
 * Sign in with Apple — App Store Review Guideline 4.8 의무 (다른 third-party SSO 보유 시).
 *
 * **네이티브 플로우** (`@capacitor-community/apple-sign-in`):
 *  - iOS 앱이 Apple 네이티브 다이얼로그로 `identityToken`(RS256 JWT) 을 받아 이 엔드포인트로 POST.
 *  - 서버는 Apple JWKS(`https://appleid.apple.com/auth/keys`) 로 서명 + issuer + audience(번들ID) 검증.
 *  - Service ID / .p8 키 불필요 — audience(`aud`) 가 앱 번들ID(`kr.ai.palette`) 이기 때문.
 *  - `sub`(Apple 사용자 식별자) 로 기존/신규 User 매칭 → 기존 OAuth 인증 경로(`authenticateOAuth`) 재사용.
 *
 * Apple 은 email 을 첫 로그인에만 보장하므로 email 누락(null) 을 정상 처리한다.
 */
@RestController
@RequestMapping("/api/v1/auth/oauth/apple")
class AppleSignInController(
    private val authenticationService: AuthenticationService,
    @Value("\${apple.client-ids:kr.ai.palette}") clientIdsCsv: String,
    @Value("\${apple.jwks-uri:https://appleid.apple.com/auth/keys}") private val jwksUri: String,
    @Value("\${apple.issuer:https://appleid.apple.com}") private val issuer: String,
) {
    private val log = LoggerFactory.getLogger(AppleSignInController::class.java)

    /** 허용 audience 집합 — 네이티브 앱 번들ID(+ 향후 web Service ID 추가 가능, CSV). */
    private val allowedAudiences: Set<String> =
        clientIdsCsv.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toSet()

    /** Apple JWKS 기반 디코더. 첫 decode 시점에 키를 원격 조회(+캐시)하므로 부팅엔 네트워크 없음. */
    private val jwtDecoder: NimbusJwtDecoder by lazy { buildDecoder() }

    private fun buildDecoder(): NimbusJwtDecoder {
        val decoder = NimbusJwtDecoder.withJwkSetUri(jwksUri)
            .jwsAlgorithm(SignatureAlgorithm.RS256)
            .build()
        val audienceValidator = OAuth2TokenValidator<Jwt> { jwt ->
            if (jwt.audience.any { it in allowedAudiences }) {
                OAuth2TokenValidatorResult.success()
            } else {
                OAuth2TokenValidatorResult.failure(
                    OAuth2Error("invalid_token", "Apple audience 불일치: ${jwt.audience}", null)
                )
            }
        }
        decoder.setJwtValidator(
            DelegatingOAuth2TokenValidator(JwtValidators.createDefaultWithIssuer(issuer), audienceValidator)
        )
        return decoder
    }

    @PostMapping
    fun signIn(@RequestBody request: AppleSignInRequest): ResponseEntity<Any> {
        // 1) identityToken 검증 (서명·issuer·audience·exp)
        val jwt: Jwt = try {
            jwtDecoder.decode(request.identityToken)
        } catch (e: JwtException) {
            log.warn("Apple identityToken 검증 실패: {}", e.message)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                mapOf("error" to "INVALID_TOKEN", "message" to "Apple 로그인 검증에 실패했어요. 다시 시도해주세요.")
            )
        }

        val sub = jwt.subject
        if (sub.isNullOrBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                mapOf("error" to "INVALID_TOKEN", "message" to "Apple 사용자 식별자를 확인할 수 없어요.")
            )
        }

        // 2) 기존 OAuth 인증 경로 재사용 (provider=APPLE, providerId=sub)
        val oauthUserInfo = OAuthUserInfo(
            provider = OAuthProvider.APPLE,
            providerId = sub,
            email = jwt.getClaimAsString("email"),  // 첫 로그인 후엔 null 일 수 있음 — 정상
            name = request.displayName,
            profileImageUrl = null,
            realName = request.displayName,  // 실명은 NICE 인증 후 갱신
            birthDate = null,
            gender = null,
        )

        return try {
            when (val result = authenticationService.authenticateOAuth(oauthUserInfo, request.betaCode)) {
                is AuthenticationResult.Success -> {
                    log.info("Apple Sign In 성공 user={} isNew={}", result.authUser.userId.value, result.isNewUser)
                    ResponseEntity.ok(
                        TokenResponse(
                            accessToken = result.authToken.accessToken,
                            refreshToken = result.authToken.refreshToken,
                            tokenType = result.authToken.tokenType,
                            expiresIn = (result.authToken.expiresAt.epochSecond - Instant.now().epochSecond).toInt(),
                        )
                    )
                }
                is AuthenticationResult.Failure -> {
                    log.warn("Apple Sign In 실패 reason={}", result.reason)
                    ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        mapOf("error" to "AUTH_FAILED", "message" to "Apple 로그인에 실패했어요. 잠시 후 다시 시도해주세요.")
                    )
                }
            }
        } catch (e: InvalidBetaCodeException) {
            // 신규 Apple 가입인데 베타 게이트 미통과 — 프론트가 베타 코드 입력 유도
            log.info("Apple Sign In 베타 게이트 차단 (신규 가입)")
            ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                mapOf(
                    "error" to "invalid_beta_code",
                    "message" to "베타 기간에는 초대 코드가 필요해요. 코드 입력 후 다시 시도해주세요.",
                )
            )
        }
    }
}
