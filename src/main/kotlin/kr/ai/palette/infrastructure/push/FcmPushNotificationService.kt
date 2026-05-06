package kr.ai.palette.infrastructure.push

import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingException
import com.google.firebase.messaging.Message
import com.google.firebase.messaging.Notification
import kr.ai.palette.application.notification.PushNotificationService
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.persistence.device.DeviceTokenJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@ConditionalOnProperty(name = ["push.provider"], havingValue = "fcm")
class FcmPushNotificationService(
    private val deviceTokenRepository: DeviceTokenJpaRepository
) : PushNotificationService {

    private val logger = LoggerFactory.getLogger(FcmPushNotificationService::class.java)

    @Transactional(readOnly = true)
    override fun sendToUser(userId: UserId, title: String, body: String) {
        val tokens = deviceTokenRepository.findByUserId(userId.value.toString())
        if (tokens.isEmpty()) {
            logger.debug("[FCM] 등록된 디바이스 없음: userId=${userId.value}")
            return
        }

        tokens.forEach { deviceToken ->
            val message = Message.builder()
                .setNotification(
                    Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build()
                )
                .setToken(deviceToken.token)
                .build()

            try {
                val messageId = FirebaseMessaging.getInstance().send(message)
                logger.info("[FCM] 전송 성공: userId=${userId.value} token=${deviceToken.token.take(10)}... messageId=$messageId")
            } catch (e: FirebaseMessagingException) {
                logger.error("[FCM] 전송 실패: userId=${userId.value} token=${deviceToken.token.take(10)}... error=${e.message}")
                handleFcmError(e, deviceToken.token)
            }
        }
    }

    @Transactional
    private fun handleFcmError(e: FirebaseMessagingException, token: String) {
        // 유효하지 않은 토큰은 DB에서 제거
        val errorCode = e.messagingErrorCode?.name ?: ""
        if (errorCode in listOf("UNREGISTERED", "INVALID_ARGUMENT")) {
            deviceTokenRepository.deleteByToken(token)
            logger.info("[FCM] 만료된 토큰 삭제: ${token.take(10)}...")
        }
    }
}
