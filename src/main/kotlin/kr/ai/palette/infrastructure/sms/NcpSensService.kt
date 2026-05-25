package kr.ai.palette.infrastructure.sms

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.*
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * NCP SENS SMS 발송 서비스 구현체 (prod)
 */
@Service
@ConditionalOnProperty(name = ["sms.provider"], havingValue = "ncp")
@EnableConfigurationProperties(NcpSensConfig::class)
class NcpSensService(
    private val config: NcpSensConfig,
    private val restClient: RestClient.Builder
) : SmsService {

    private val logger = LoggerFactory.getLogger(NcpSensService::class.java)
    private val client: RestClient = restClient.baseUrl("https://sens.apigw.ntruss.com").build()

    override fun sendSms(phoneNumber: String, message: String): Boolean {
        // 자격증명 누락 가드 — 키 없이 활성된 경우 즉시 실패 (로그로 명확히)
        if (config.accessKey.isBlank() || config.secretKey.isBlank() || config.serviceId.isBlank()) {
            logger.error("[NCP SENS] 자격증명 누락 — NCP_SENS_ACCESS_KEY / SECRET_KEY / SERVICE_ID 확인 필요")
            return false
        }
        return try {
            val timestamp = Instant.now().toEpochMilli().toString()
            val signature = makeSignature(timestamp)

            val request = SmsRequest(
                type = "SMS",
                contentType = "COMM",
                countryCode = "82",
                from = config.fromNumber,
                content = message,
                messages = listOf(SmsMessage(to = phoneNumber))
            )

            val response = client.post()
                .uri("/sms/v2/services/${config.serviceId}/messages")
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .header("x-ncp-apigw-timestamp", timestamp)
                .header("x-ncp-iam-access-key", config.accessKey)
                .header("x-ncp-apigw-signature-v2", signature)
                .body(request)
                .retrieve()
                .toEntity(String::class.java)

            val success = response.statusCode.is2xxSuccessful
            if (success) {
                logger.info("SMS sent successfully to $phoneNumber")
            } else {
                logger.error("Failed to send SMS to $phoneNumber: ${response.statusCode}")
            }
            success
        } catch (e: Exception) {
            logger.error("Error sending SMS to $phoneNumber", e)
            false
        }
    }

    /**
     * NCP API 서명을 생성합니다.
     */
    private fun makeSignature(timestamp: String): String {
        val method = "POST"
        val url = "/sms/v2/services/${config.serviceId}/messages"
        val message = StringBuilder()
            .append(method)
            .append(" ")
            .append(url)
            .append("\n")
            .append(timestamp)
            .append("\n")
            .append(config.accessKey)
            .toString()

        val signingKey = SecretKeySpec(config.secretKey.toByteArray(StandardCharsets.UTF_8), "HmacSHA256")
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(signingKey)
        val rawHmac = mac.doFinal(message.toByteArray(StandardCharsets.UTF_8))
        return Base64.getEncoder().encodeToString(rawHmac)
    }
}

/**
 * NCP SENS SMS 요청 DTO
 */
private data class SmsRequest(
    val type: String,
    val contentType: String,
    val countryCode: String,
    val from: String,
    val content: String,
    val messages: List<SmsMessage>
)

/**
 * NCP SENS SMS 메시지 DTO
 */
private data class SmsMessage(
    val to: String
)
