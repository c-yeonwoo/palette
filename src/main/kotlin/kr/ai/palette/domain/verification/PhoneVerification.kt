package kr.ai.palette.domain.verification

import java.time.LocalDateTime
import kotlin.random.Random

/**
 * 핸드폰 인증 정보
 */
data class PhoneVerification(
    val phoneNumber: String,
    val verificationCode: String,
    val createdAt: LocalDateTime,
    val expiresAt: LocalDateTime,
    val isVerified: Boolean = false
) {
    companion object {
        private const val CODE_LENGTH = 6
        private const val EXPIRY_MINUTES = 3L

        /**
         * 새로운 인증 정보를 생성합니다.
         */
        fun create(phoneNumber: String): PhoneVerification {
            val now = LocalDateTime.now()
            return PhoneVerification(
                phoneNumber = phoneNumber,
                verificationCode = generateCode(),
                createdAt = now,
                expiresAt = now.plusMinutes(EXPIRY_MINUTES),
                isVerified = false
            )
        }

        /**
         * 고정 코드로 인증 정보를 생성합니다 (dev/qa 전용).
         */
        fun createWithCode(phoneNumber: String, code: String): PhoneVerification {
            val now = LocalDateTime.now()
            return PhoneVerification(
                phoneNumber = phoneNumber,
                verificationCode = code,
                createdAt = now,
                expiresAt = now.plusMinutes(EXPIRY_MINUTES),
                isVerified = false
            )
        }

        /**
         * 6자리 인증번호를 생성합니다.
         */
        private fun generateCode(): String {
            return Random.nextInt(100000, 999999).toString()
        }
    }

    /**
     * 인증번호가 만료되었는지 확인합니다.
     */
    fun isExpired(): Boolean {
        return LocalDateTime.now().isAfter(expiresAt)
    }

    /**
     * 인증번호를 검증합니다.
     */
    fun verify(code: String): PhoneVerification {
        require(!isExpired()) { "인증번호가 만료되었습니다" }
        require(verificationCode == code) { "인증번호가 일치하지 않습니다" }
        return copy(isVerified = true)
    }
}

/**
 * 핸드폰 인증 저장소
 */
interface PhoneVerificationRepository {
    /**
     * 인증 정보를 저장합니다.
     */
    fun save(verification: PhoneVerification)

    /**
     * 핸드폰 번호로 인증 정보를 조회합니다.
     */
    fun findByPhoneNumber(phoneNumber: String): PhoneVerification?

    /**
     * 인증 정보를 삭제합니다.
     */
    fun deleteByPhoneNumber(phoneNumber: String)
}
