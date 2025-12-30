package kr.ai.palette.persistence.verification

import kr.ai.palette.domain.verification.PhoneVerification
import kr.ai.palette.domain.verification.PhoneVerificationRepository
import org.springframework.stereotype.Repository
import java.util.concurrent.ConcurrentHashMap

/**
 * 인메모리 핸드폰 인증 저장소
 * TODO: 프로덕션 환경에서는 Redis로 대체해야 합니다.
 */
@Repository
class InMemoryPhoneVerificationRepository : PhoneVerificationRepository {

    private val storage = ConcurrentHashMap<String, PhoneVerification>()

    override fun save(verification: PhoneVerification) {
        storage[verification.phoneNumber] = verification
    }

    override fun findByPhoneNumber(phoneNumber: String): PhoneVerification? {
        return storage[phoneNumber]
    }

    override fun deleteByPhoneNumber(phoneNumber: String) {
        storage.remove(phoneNumber)
    }
}
