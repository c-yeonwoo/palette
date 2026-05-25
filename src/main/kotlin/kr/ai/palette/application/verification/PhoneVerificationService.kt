package kr.ai.palette.application.verification

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.domain.verification.PhoneVerification
import kr.ai.palette.domain.verification.PhoneVerificationRepository
import kr.ai.palette.infrastructure.sms.SmsService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.env.Environment
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * 핸드폰 인증 서비스
 *
 * 베타 단계 동작:
 *  - app.phone-verification-bypass=true (default) → SMS 안 보내고 "000000" 으로 통과
 *  - 정식 SMS 발송 활성화 시 false 로 변경
 */
@Service
class PhoneVerificationService(
    private val phoneVerificationRepository: PhoneVerificationRepository,
    private val userRepository: UserRepository,
    private val smsService: SmsService,
    private val environment: Environment,
    @Value("\${app.phone-verification-bypass:true}")
    private val bypassEnabled: Boolean,
) {
    private val logger = LoggerFactory.getLogger(PhoneVerificationService::class.java)

    /** dev/qa 프로파일 또는 베타 bypass 토글 시 SMS/코드검증 스킵 */
    private val isBypassed: Boolean
        get() = bypassEnabled ||
            environment.activeProfiles.any { it == "dev" || it == "qa" }

    /**
     * 인증번호를 발송합니다.
     * dev/qa 환경에서는 SMS를 발송하지 않고 고정 코드 000000을 사용합니다.
     */
    fun sendVerificationCode(phoneNumber: String): SendVerificationCodeResult {
        // 핸드폰 번호 형식 검증
        val cleanedPhoneNumber = cleanPhoneNumber(phoneNumber)
        require(isValidPhoneNumber(cleanedPhoneNumber)) { "유효하지 않은 핸드폰 번호입니다" }

        // 기존 인증 정보 삭제
        phoneVerificationRepository.deleteByPhoneNumber(cleanedPhoneNumber)

        // 베타/dev/qa: SMS 안 보내고 고정 코드 "000000" 으로 인증 정보 저장
        if (isBypassed) {
            val verification = PhoneVerification.createWithCode(cleanedPhoneNumber, "000000")
            phoneVerificationRepository.save(verification)
            logger.info("[BYPASS] SMS skipped for $cleanedPhoneNumber — use code 000000")
            return SendVerificationCodeResult.Success(
                phoneNumber = cleanedPhoneNumber,
                expiresAt = verification.expiresAt
            )
        }

        // 새로운 인증 정보 생성
        val verification = PhoneVerification.create(cleanedPhoneNumber)
        phoneVerificationRepository.save(verification)

        // SMS 발송
        val message = "[Palette] 인증번호는 [${verification.verificationCode}]입니다. 3분 내에 입력해주세요."
        val success = smsService.sendSms(cleanedPhoneNumber, message)

        return if (success) {
            logger.info("Verification code sent to $cleanedPhoneNumber")
            SendVerificationCodeResult.Success(
                phoneNumber = cleanedPhoneNumber,
                expiresAt = verification.expiresAt
            )
        } else {
            logger.error("Failed to send verification code to $cleanedPhoneNumber")
            phoneVerificationRepository.deleteByPhoneNumber(cleanedPhoneNumber)
            SendVerificationCodeResult.Failure("SMS 발송에 실패했습니다")
        }
    }

    /**
     * 인증번호를 검증합니다.
     * dev/qa 환경에서는 어떤 코드든 통과합니다.
     */
    @Transactional
    fun verifyCode(phoneNumber: String, code: String, userId: String?): VerifyCodeResult {
        val cleanedPhoneNumber = cleanPhoneNumber(phoneNumber)

        // 베타/dev/qa: 코드 검증 없이 통과
        if (isBypassed) {
            logger.info("[BYPASS] Auto-pass phone verification for $cleanedPhoneNumber")
            if (userId != null) updateUserPhoneVerification(userId, cleanedPhoneNumber)
            phoneVerificationRepository.deleteByPhoneNumber(cleanedPhoneNumber)
            return VerifyCodeResult.Success(phoneNumber = cleanedPhoneNumber)
        }

        // 인증 정보 조회
        val verification = phoneVerificationRepository.findByPhoneNumber(cleanedPhoneNumber)
            ?: return VerifyCodeResult.Failure("인증 정보가 존재하지 않습니다")

        // 만료 확인
        if (verification.isExpired()) {
            phoneVerificationRepository.deleteByPhoneNumber(cleanedPhoneNumber)
            return VerifyCodeResult.Failure("인증번호가 만료되었습니다")
        }

        // 인증번호 검증
        return try {
            val verifiedVerification = verification.verify(code)
            phoneVerificationRepository.save(verifiedVerification)

            // 사용자 정보 업데이트 (userId가 제공된 경우)
            if (userId != null) {
                updateUserPhoneVerification(userId, cleanedPhoneNumber)
            }

            // 인증 완료 후 정보 삭제
            phoneVerificationRepository.deleteByPhoneNumber(cleanedPhoneNumber)

            logger.info("Phone verification successful for $cleanedPhoneNumber")
            VerifyCodeResult.Success(phoneNumber = cleanedPhoneNumber)
        } catch (e: IllegalArgumentException) {
            logger.warn("Phone verification failed for $cleanedPhoneNumber: ${e.message}")
            VerifyCodeResult.Failure(e.message ?: "인증에 실패했습니다")
        }
    }

    /**
     * 사용자의 핸드폰 인증 정보를 업데이트합니다.
     */
    private fun updateUserPhoneVerification(userId: String, phoneNumber: String) {
        val user = userRepository.findById(UserId(UUID.fromString(userId))) ?: return
        val updatedUser = user
            .updatePrivateInfo(
                user.privateInfo.copy(
                    phoneNumber = phoneNumber,
                    isPhoneVerified = true
                )
            )
            .verifyPhone()
        userRepository.save(updatedUser)
    }

    /**
     * 핸드폰 번호를 정규화합니다 (하이픈 제거, 국가번호 처리)
     */
    private fun cleanPhoneNumber(phoneNumber: String): String {
        var cleaned = phoneNumber.replace("-", "").replace(" ", "")

        // +82 또는 82로 시작하는 경우 0으로 변경
        if (cleaned.startsWith("+82")) {
            cleaned = "0" + cleaned.substring(3)
        } else if (cleaned.startsWith("82")) {
            cleaned = "0" + cleaned.substring(2)
        }

        return cleaned
    }

    /**
     * 유효한 한국 핸드폰 번호인지 확인합니다.
     */
    private fun isValidPhoneNumber(phoneNumber: String): Boolean {
        // 010, 011, 016, 017, 018, 019로 시작하고 10-11자리
        return phoneNumber.matches(Regex("^01[0-9]\\d{7,8}$"))
    }
}

/**
 * 인증번호 발송 결과
 */
sealed class SendVerificationCodeResult {
    data class Success(
        val phoneNumber: String,
        val expiresAt: java.time.LocalDateTime
    ) : SendVerificationCodeResult()

    data class Failure(val message: String) : SendVerificationCodeResult()
}

/**
 * 인증번호 검증 결과
 */
sealed class VerifyCodeResult {
    data class Success(val phoneNumber: String) : VerifyCodeResult()
    data class Failure(val message: String) : VerifyCodeResult()
}
