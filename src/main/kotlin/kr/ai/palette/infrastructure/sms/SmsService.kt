package kr.ai.palette.infrastructure.sms

/**
 * SMS 발송 서비스 인터페이스
 */
interface SmsService {
    /**
     * SMS를 발송합니다.
     * @param phoneNumber 수신자 번호 (하이픈 없는 숫자만)
     * @param message 메시지 내용
     * @return 발송 성공 여부
     */
    fun sendSms(phoneNumber: String, message: String): Boolean
}
