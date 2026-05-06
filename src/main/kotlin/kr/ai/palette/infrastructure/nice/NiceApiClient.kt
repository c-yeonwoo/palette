package kr.ai.palette.infrastructure.nice

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.time.Instant
import java.util.Base64
import java.util.UUID

/**
 * NICE 본인인증 API v2.0 클라이언트
 *
 * 문서: https://developer.niceid.co.kr/
 * 엔드포인트: https://svc.niceapi.co.kr:22001
 */
@Component
class NiceApiClient(
    @Value("\${nice.client-id:}") private val clientId: String,
    @Value("\${nice.client-secret:}") private val clientSecret: String,
    @Value("\${nice.product-id:2101979031}") private val productId: String,
) {
    private val logger = LoggerFactory.getLogger(NiceApiClient::class.java)
    private val baseUrl = "https://svc.niceapi.co.kr:22001"

    val isConfigured: Boolean
        get() = clientId.isNotBlank() && clientSecret.isNotBlank()

    private val restClient = RestClient.builder()
        .baseUrl(baseUrl)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .build()

    /**
     * Step 1: OAuth 2.0 Bearer 토큰 발급
     * POST /digital/niceid/oauth/oauth/token
     */
    fun getAccessToken(): String {
        val credentials = Base64.getEncoder().encodeToString("$clientId:$clientSecret".toByteArray())
        val timestamp = Instant.now().epochSecond
        val clientAuth = Base64.getEncoder().encodeToString(
            "$timestamp:$clientId".toByteArray()
        )

        val response = restClient.post()
            .uri("/digital/niceid/oauth/oauth/token")
            .header(HttpHeaders.AUTHORIZATION, "Basic $credentials")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body("grant_type=client_credentials&scope=default")
            .retrieve()
            .body(NiceTokenResponse::class.java)
            ?: throw IllegalStateException("NICE access token response is null")

        return response.accessToken
    }

    /**
     * Step 2: 암호화 토큰 요청 (세션 키 + tokenVersionId 획득)
     * POST /digital/niceid/api/v1.0/common/crypto/token
     */
    fun getCryptoToken(accessToken: String): NiceCryptoTokenResponse {
        val timestamp = Instant.now().epochSecond
        val randomKey = UUID.randomUUID().toString().replace("-", "").substring(0, 16)

        val response = restClient.post()
            .uri("/digital/niceid/api/v1.0/common/crypto/token")
            .header(HttpHeaders.AUTHORIZATION, "bearer $accessToken")
            .header("client_id", clientId)
            .header("productID", productId)
            .contentType(MediaType.APPLICATION_JSON)
            .body(mapOf("dataHeader" to mapOf("CNTY_CD" to "ko")))
            .retrieve()
            .body(NiceCryptoTokenApiResponse::class.java)
            ?: throw IllegalStateException("NICE crypto token response is null")

        if (response.dataHeader.GW_RSLT_CD != "1200") {
            throw IllegalStateException("NICE crypto token error: ${response.dataHeader.GW_RSLT_MSG}")
        }

        return response.dataBody
    }
}

data class NiceTokenResponse(
    val access_token: String,
    val token_type: String,
    val expires_in: Long,
    val scope: String
) {
    val accessToken: String get() = access_token
}

data class NiceCryptoTokenApiResponse(
    val dataHeader: NiceDataHeader,
    val dataBody: NiceCryptoTokenResponse
)

data class NiceDataHeader(
    val CNTY_CD: String = "ko",
    val GW_RSLT_CD: String = "",
    val GW_RSLT_MSG: String = ""
)

data class NiceCryptoTokenResponse(
    val tokenVersionId: String,   // 세션 키 버전 ID
    val encData: String,          // 암호화된 세션 키 (Base64)
    val integrityValue: String    // HMAC 무결성 검증값
)
