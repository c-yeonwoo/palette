package kr.ai.palette.application.notification

import kr.ai.palette.domain.common.UserId
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

interface PushNotificationService {
    fun sendToUser(userId: UserId, title: String, body: String)
}

/**
 * 항상 등록되는 fallback 구현.
 * FcmPushNotificationService 가 활성된 경우 @Primary 로 그쪽이 우선됨.
 * Firebase 자격증명이 없는 환경에선 Stub 만 존재 → Stub 이 주입됨.
 */
@Service
class StubPushNotificationService : PushNotificationService {
    private val logger = LoggerFactory.getLogger(StubPushNotificationService::class.java)

    override fun sendToUser(userId: UserId, title: String, body: String) {
        logger.info("[PUSH STUB] userId=${userId.value} | title=$title | body=$body")
    }
}
