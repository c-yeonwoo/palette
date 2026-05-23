package kr.ai.palette.infrastructure.push

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.FileInputStream

/**
 * FCM 빈 등록은 다음 두 조건 모두 만족 시에만:
 *   - push.provider = fcm
 *   - firebase.service-account-key-path 또는 -json 중 하나가 비어있지 않음
 *
 * 자격증명이 없는 환경(베타 초기 EC2 등)에선 활성 안 되고
 * MockPushNotificationService 가 대신 동작.
 */
@Configuration
@ConditionalOnExpression(
    "'\${push.provider:mock}' == 'fcm' and " +
        "('\${firebase.service-account-key-path:}'.length() > 0 or " +
        "'\${firebase.service-account-key-json:}'.length() > 0)"
)
class FcmConfig(
    @Value("\${firebase.service-account-key-path:}") private val keyPath: String,
    @Value("\${firebase.service-account-key-json:}") private val keyJson: String,
) {
    private val logger = LoggerFactory.getLogger(FcmConfig::class.java)

    @Bean
    fun firebaseApp(): FirebaseApp {
        if (FirebaseApp.getApps().isNotEmpty()) {
            return FirebaseApp.getInstance()
        }

        val credentials: GoogleCredentials = when {
            keyJson.isNotBlank() -> {
                logger.info("FCM: 환경변수 JSON으로 초기화")
                GoogleCredentials.fromStream(keyJson.byteInputStream())
                    .createScoped("https://www.googleapis.com/auth/firebase.messaging")
            }
            keyPath.isNotBlank() -> {
                logger.info("FCM: 파일 경로($keyPath)로 초기화")
                GoogleCredentials.fromStream(FileInputStream(keyPath))
                    .createScoped("https://www.googleapis.com/auth/firebase.messaging")
            }
            else -> error("FcmConfig 가 활성됐지만 키가 비어있음 — 조건 검증 로직 점검")
        }

        val options = FirebaseOptions.builder()
            .setCredentials(credentials)
            .build()

        return FirebaseApp.initializeApp(options)
    }
}
