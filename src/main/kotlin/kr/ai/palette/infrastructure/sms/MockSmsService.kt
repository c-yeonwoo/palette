package kr.ai.palette.infrastructure.sms

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service

/**
 * Mock SMS 서비스 (dev/qa) — 콘솔 로그만 출력, 항상 성공
 */
@Service
@ConditionalOnProperty(name = ["sms.provider"], havingValue = "mock", matchIfMissing = true)
class MockSmsService : SmsService {

    private val logger = LoggerFactory.getLogger(MockSmsService::class.java)

    override fun sendSms(phoneNumber: String, message: String): Boolean {
        logger.info("[MOCK SMS] To: $phoneNumber | Message: $message")
        return true
    }
}
