package kr.ai.palette.application.notification

import kr.ai.palette.domain.common.UserId
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service

interface PushNotificationService {
    fun sendToUser(userId: UserId, title: String, body: String)
}

@Service
@ConditionalOnProperty(name = ["push.provider"], havingValue = "stub", matchIfMissing = true)
class StubPushNotificationService : PushNotificationService {
    private val logger = LoggerFactory.getLogger(StubPushNotificationService::class.java)

    override fun sendToUser(userId: UserId, title: String, body: String) {
        logger.info("[PUSH STUB] userId=${userId.value} | title=$title | body=$body")
    }
}
