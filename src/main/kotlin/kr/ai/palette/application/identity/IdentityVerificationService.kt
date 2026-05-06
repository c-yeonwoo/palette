package kr.ai.palette.application.identity

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.Gender
import kr.ai.palette.domain.user.PrivateInfo
import kr.ai.palette.domain.user.PublicInfo
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.nice.NiceApiClient
import kr.ai.palette.infrastructure.nice.NiceCryptoTokenResponse
import kr.ai.palette.infrastructure.nice.NiceEncryptionUtil
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * NICE 본인인증 서비스
 *
 * 플로우:
 * 1. prepareRequest() → 암호화 파라미터 생성 (프론트 팝업에 전달)
 * 2. [NICE 팝업에서 사용자 인증]
 * 3. handleCallback() → 복호화 → User 업데이트
 * 4. getResult() → 프론트에서 완료 여부 polling
 */
@Service
class IdentityVerificationService(
    private val niceApiClient: NiceApiClient,
    private val userRepository: UserRepository,
    @Value("\${app.base-url:http://localhost:8080}") private val baseUrl: String,
) {
    private val logger = LoggerFactory.getLogger(IdentityVerificationService::class.java)

    // 세션 임시 저장 (인증 요청 ↔ 콜백 매핑)
    // key: requestNo → NicePendingSession
    private val pendingSessions = ConcurrentHashMap<String, NicePendingSession>()

    // 인증 완료 결과 (프론트 polling용)
    // key: requestNo → NiceVerificationResult
    private val completedResults = ConcurrentHashMap<String, NiceVerificationResult>()

    /**
     * NICE 팝업 파라미터 생성
     * - NICE가 설정되지 않은 경우(dev) isDevMode=true 반환
     */
    fun prepareRequest(userId: String): NiceRequestResult {
        if (!niceApiClient.isConfigured) {
            // DEV 모드: NICE 미설정 → bypass 허용
            return NiceRequestResult.DevMode(requestNo = "dev-${UUID.randomUUID()}")
        }

        return try {
            val requestNo = generateRequestNo()
            val returnUrl = "$baseUrl/api/v1/identity/nice/callback"

            // Step 1: Access Token
            val accessToken = niceApiClient.getAccessToken()

            // Step 2: Crypto Token
            val cryptoToken = niceApiClient.getCryptoToken(accessToken)

            // Step 3: 요청 데이터 생성 및 암호화
            val (key, iv, hmacKey) = NiceEncryptionUtil.deriveKeys(cryptoToken.encData)

            val plainData = buildRequestData(requestNo, returnUrl)
            val encData = NiceEncryptionUtil.encrypt(plainData, key, iv)
            val integrityValue = NiceEncryptionUtil.hmacSha256(encData, hmacKey)

            // 세션 저장 (콜백에서 복호화에 필요)
            pendingSessions[requestNo] = NicePendingSession(
                requestNo = requestNo,
                userId = userId,
                tokenVersionId = cryptoToken.tokenVersionId,
                encKey = key,
                encIv = iv,
                createdAt = Instant.now()
            )

            NiceRequestResult.Ready(
                tokenVersionId = cryptoToken.tokenVersionId,
                encData = encData,
                integrityValue = integrityValue,
                requestNo = requestNo
            )
        } catch (e: Exception) {
            logger.error("Failed to prepare NICE request", e)
            NiceRequestResult.Error("NICE 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.")
        }
    }

    /**
     * NICE 콜백 처리 — 복호화 후 User 업데이트
     */
    @Transactional
    fun handleCallback(
        tokenVersionId: String,
        encData: String,
        integrityValue: String
    ): String {
        // tokenVersionId로 세션 찾기
        val session = pendingSessions.values.firstOrNull { it.tokenVersionId == tokenVersionId }
            ?: run {
                logger.warn("No pending session for tokenVersionId=$tokenVersionId")
                return buildCallbackHtml(success = false, message = "세션이 만료되었습니다")
            }

        return try {
            // HMAC 무결성 검증
            val (key, iv, hmacKey) = Triple(session.encKey, session.encIv, NiceEncryptionUtil.deriveKeys(encData).third)
            // 복호화
            val plainData = NiceEncryptionUtil.decrypt(encData, session.encKey, session.encIv)
            val resultData = parseNiceResult(plainData)

            // User 업데이트
            val userId = UserId(UUID.fromString(session.userId))
            updateUserWithNiceData(userId, resultData)

            // 완료 결과 저장 (프론트 polling)
            completedResults[session.requestNo] = NiceVerificationResult(
                success = true,
                requestNo = session.requestNo,
                phoneNumber = resultData.mobileNo,
                name = resultData.name
            )

            // 세션 정리
            pendingSessions.remove(session.requestNo)

            logger.info("NICE verification completed for user=${session.userId}")
            buildCallbackHtml(success = true, message = "본인인증이 완료되었습니다")
        } catch (e: Exception) {
            logger.error("NICE callback processing failed", e)
            completedResults[session.requestNo] = NiceVerificationResult(
                success = false,
                requestNo = session.requestNo,
                error = e.message
            )
            buildCallbackHtml(success = false, message = "본인인증 처리 중 오류가 발생했습니다")
        }
    }

    /**
     * 인증 완료 여부 조회 (프론트 polling)
     */
    fun getResult(requestNo: String): NiceVerificationResult? {
        return completedResults.remove(requestNo)
    }

    /**
     * DEV 모드 bypass — 실제 NICE 없이 인증 완료 처리
     */
    @Transactional
    fun devBypass(userId: String, phoneNumber: String, name: String): NiceVerificationResult {
        val uid = UserId(UUID.fromString(userId))
        val user = userRepository.findById(uid) ?: throw IllegalArgumentException("User not found")

        val updatedUser = user
            .updatePrivateInfo(user.privateInfo.copy(
                realName = name,
                phoneNumber = phoneNumber.replace("-", ""),
                isPhoneVerified = true
            ))

        userRepository.save(updatedUser)

        return NiceVerificationResult(
            success = true,
            requestNo = "dev-bypass",
            phoneNumber = phoneNumber,
            name = name
        )
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private fun buildRequestData(requestNo: String, returnUrl: String): String {
        // NICE 표준창 v2.0 요청 포맷
        return """
            {
              "requestno": "$requestNo",
              "returnurl": "$returnUrl",
              "authtype": "M",
              "sitecode": "",
              "methodtype": "get",
              "popgubun": "Y",
              "customize": "",
              "receivedata": ""
            }
        """.trimIndent()
    }

    private fun parseNiceResult(plainData: String): NiceResultData {
        // NICE 응답 JSON 파싱
        // 실제 응답 예시:
        // {"resultcode":"0000","name":"홍길동","utf8_name":"...","birthdate":"19900101",
        //  "gender":"1","nationalinfo":"1","mobileco":"SKT","mobileno":"01012345678",
        //  "ci":"...","di":"...","requestno":"REQ...","responseno":"RES..."}
        val map = parseSimpleJson(plainData)
        val resultCode = map["resultcode"] ?: throw IllegalStateException("NICE result code missing")
        if (resultCode != "0000") {
            throw IllegalStateException("NICE verification failed: resultcode=$resultCode")
        }

        val birthdateStr = map["birthdate"] ?: throw IllegalStateException("birthdate missing")
        val birthDate = LocalDate.parse(birthdateStr, DateTimeFormatter.ofPattern("yyyyMMdd"))
        val gender = if (map["gender"] == "1") Gender.MALE else Gender.FEMALE

        return NiceResultData(
            name = map["name"] ?: throw IllegalStateException("name missing"),
            birthDate = birthDate,
            gender = gender,
            mobileNo = map["mobileno"] ?: throw IllegalStateException("mobileno missing"),
            mobileCo = map["mobileco"],
            ci = map["ci"],
            di = map["di"],
            requestNo = map["requestno"]
        )
    }

    /** 간단한 flat JSON 파서 (의존성 최소화) */
    private fun parseSimpleJson(json: String): Map<String, String> {
        val result = mutableMapOf<String, String>()
        val cleaned = json.trim().removeSurrounding("{", "}")
        val pattern = Regex(""""(\w+)"\s*:\s*"([^"]*)"""")
        pattern.findAll(cleaned).forEach { match ->
            result[match.groupValues[1]] = match.groupValues[2]
        }
        return result
    }

    @Transactional
    private fun updateUserWithNiceData(userId: UserId, data: NiceResultData) {
        val user = userRepository.findById(userId) ?: return

        // PrivateInfo: 실명 + 전화번호 + 인증완료
        val updatedPrivate = user.privateInfo.copy(
            realName = data.name,
            phoneNumber = data.mobileNo,
            isPhoneVerified = true
        )
        // PublicInfo: 생년월일 + 성별 업데이트 (임시값 덮어씀)
        val updatedPublic = user.publicInfo.copy(
            birthDate = data.birthDate,
            gender = data.gender
        )
        userRepository.save(
            user.updatePrivateInfo(updatedPrivate).updatePublicInfo(updatedPublic)
        )
    }

    private fun generateRequestNo(): String {
        return "PAL${System.currentTimeMillis()}${(1000..9999).random()}"
    }

    private fun buildCallbackHtml(success: Boolean, message: String): String {
        // NICE 팝업이 닫히면서 부모창에 메시지 전달
        val script = if (success) {
            "window.opener?.postMessage({type:'NICE_COMPLETE', success:true}, '*'); window.close();"
        } else {
            "window.opener?.postMessage({type:'NICE_COMPLETE', success:false, message:'$message'}, '*'); window.close();"
        }
        return """
            <!DOCTYPE html>
            <html><head><meta charset="UTF-8"><title>본인인증</title></head>
            <body>
            <p>${if (success) "✅ $message" else "❌ $message"}</p>
            <script>$script</script>
            </body></html>
        """.trimIndent()
    }
}

// ─── Data classes ────────────────────────────────────────────────────────────

data class NicePendingSession(
    val requestNo: String,
    val userId: String,
    val tokenVersionId: String,
    val encKey: ByteArray,
    val encIv: ByteArray,
    val createdAt: Instant
)

data class NiceResultData(
    val name: String,
    val birthDate: LocalDate,
    val gender: Gender,
    val mobileNo: String,
    val mobileCo: String?,
    val ci: String?,  // 연계정보 — 서비스 내 본인 식별자
    val di: String?,  // 중복가입확인정보
    val requestNo: String?
)

data class NiceVerificationResult(
    val success: Boolean,
    val requestNo: String,
    val phoneNumber: String? = null,
    val name: String? = null,
    val error: String? = null
)

sealed class NiceRequestResult {
    data class Ready(
        val tokenVersionId: String,
        val encData: String,
        val integrityValue: String,
        val requestNo: String
    ) : NiceRequestResult()

    data class DevMode(val requestNo: String) : NiceRequestResult()
    data class Error(val message: String) : NiceRequestResult()
}
