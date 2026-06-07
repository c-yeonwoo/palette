package kr.ai.palette.presentation.auth

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class AppleSignInRequest(
    /** Capacitor Apple Sign-In SDK 가 발급한 identityToken (JWT). */
    val identityToken: String,
    /** authorizationCode — refresh 토큰 발급용. */
    val authorizationCode: String? = null,
    /** 사용자가 첫 가입 시 제공하는 이름 (Apple 은 첫 가입 1회만 노출). */
    val displayName: String? = null,
)

/**
 * Sign in with Apple — App Store Review Guideline 4.8 의무 (다른 third-party SSO 보유 시).
 *
 * **베타 상태**: 백엔드 stub. Apple Developer 계정 + Sign in with Apple 키 등록 후 활성화.
 *
 * 정식 구현 절차 (RUNBOOK §앱스토어 심사 참조):
 *  1) Apple Developer 콘솔에서 App ID 에 "Sign In with Apple" capability 추가
 *  2) Service ID 발급 + JWT 서명 키 (.p8) 다운로드
 *  3) application.yml 에 키 ID / 팀 ID / clientId 주입
 *  4) identityToken (RS256 JWT) 검증:
 *     - issuer = "https://appleid.apple.com"
 *     - audience = clientId
 *     - signature = Apple JWKS (https://appleid.apple.com/auth/keys)
 *  5) sub claim 으로 User 매칭 (없으면 신규 가입)
 *  6) 기존 AuthController.issueTokenPair() 와 동일 형태 JWT 반환
 *
 * 라이브러리: jose4j 또는 nimbus-jose-jwt + RestClient.
 */
@RestController
@RequestMapping("/api/v1/auth/oauth/apple")
class AppleSignInController {

    private val log = LoggerFactory.getLogger(AppleSignInController::class.java)

    @PostMapping
    fun signIn(@RequestBody request: AppleSignInRequest): ResponseEntity<Map<String, Any>> {
        log.warn(
            "Apple Sign In 호출됨 (베타 stub) — identityToken length={} displayName={}",
            request.identityToken.length,
            request.displayName?.take(20) ?: "(없음)",
        )
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(
            mapOf(
                "error" to "NOT_IMPLEMENTED",
                "message" to "Apple 로그인은 곧 지원될 예정입니다. 현재는 카카오 또는 이메일로 가입해주세요.",
            )
        )
    }
}
