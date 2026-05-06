package kr.ai.palette.infrastructure.push

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.FileInputStream
import java.io.InputStream

@Configuration
@ConditionalOnProperty(name = ["push.provider"], havingValue = "fcm")
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
            else -> {
                logger.info("FCM: Application Default Credentials로 초기화")
                GoogleCredentials.getApplicationDefault()
                    .createScoped("https://www.googleapis.com/auth/firebase.messaging")
            }
        }

        val options = FirebaseOptions.builder()
            .setCredentials(credentials)
            .build()

        return FirebaseApp.initializeApp(options)
    }
}
