package kr.ai.palette.domain.user

import java.time.Instant

data class TermsAgreement(
    val agreedTermsService: Boolean,
    val agreedTermsPrivacy: Boolean,
    val agreedMarketing: Boolean,
    val agreedAt: Instant
) {
    fun isAllRequiredTermsAgreed(): Boolean {
        return agreedTermsService && agreedTermsPrivacy
    }
}
