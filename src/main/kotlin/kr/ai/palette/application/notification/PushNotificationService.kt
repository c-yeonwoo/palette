package kr.ai.palette.application.notification

import kr.ai.palette.domain.common.UserId
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

interface PushNotificationService {
    fun sendToUser(userId: UserId, title: String, body: String)
}

/**
 * TODO: FCM(Firebase Cloud Messaging) 또는 APNs 연동으로 교체
 * 현재는 로그 출력만 수행하는 스텁 구현체
 */
@Service
class StubPushNotificationService : PushNotificationService {
    private val logger = LoggerFactory.getLogger(StubPushNotificationService::class.java)

    override fun sendToUser(userId: UserId, title: String, body: String) {
        logger.info("[PUSH STUB] userId=${userId.value} | title=$title | body=$body")
    }
}
