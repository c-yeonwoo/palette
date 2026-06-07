package kr.ai.palette.domain.user

import kr.ai.palette.domain.common.UserId

data class User(
    val id: UserId,
    val oauthInfo: OAuthInfo?,  // nullable for email-based users
    val password: String?,  // nullable for OAuth users, BCrypt hashed for email users
    val privateInfo: PrivateInfo,
    val publicInfo: PublicInfo,
    val accountType: AccountType,
    val isProfileCompleted: Boolean,
    val termsAgreement: TermsAgreement,
    val metadata: UserMetadata,
    /** 운영자(/admin) 접근 권한. 기본 USER. ADMIN 은 별도 시드/INSERT로만 부여. */
    val role: UserRole = UserRole.USER,
    /** 사용자 활동 상태 (운영자만 변경 가능). 탈퇴는 metadata.deletedAt 으로 별개. */
    val status: UserStatus = UserStatus.ACTIVE,
    /** 상태 변경 사유 / 시각 / 변경자 (운영자 ID). status != ACTIVE 일 때 채워짐. */
    val statusReason: String? = null,
    val statusUpdatedAt: java.time.Instant? = null,
    val statusUpdatedBy: UserId? = null,
) {
    fun isAdmin(): Boolean = role == UserRole.ADMIN
    fun isActive(): Boolean = status == UserStatus.ACTIVE && !metadata.isDeleted()

    /** 운영자가 상태 변경 — 사유 필수 (SUSPENDED), DORMANT 는 사유 선택 */
    fun changeStatus(
        newStatus: UserStatus,
        reason: String?,
        operatorId: UserId,
        at: java.time.Instant = java.time.Instant.now(),
    ): User {
        require(newStatus != UserStatus.SUSPENDED || !reason.isNullOrBlank()) {
            "SUSPENDED 상태 변경은 사유 필수입니다"
        }
        return copy(
            status = newStatus,
            statusReason = reason?.takeIf { it.isNotBlank() },
            statusUpdatedAt = at,
            statusUpdatedBy = operatorId,
            metadata = metadata.copy(updatedAt = at),
        )
    }

    fun canUseMatchingService(): Boolean {
        return accountType == AccountType.REGULAR && isProfileCompleted && !metadata.isDeleted()
    }

    fun canBeMatchmaker(): Boolean {
        // 주선자는 핸드폰 인증이 필수
        return !metadata.isDeleted() && privateInfo.isPhoneVerified
    }

    fun completeProfile(): User {
        require(accountType == AccountType.REGULAR) { "Only REGULAR users can complete profile" }
        return copy(isProfileCompleted = true)
    }

    fun updatePublicInfo(publicInfo: PublicInfo): User {
        return copy(publicInfo = publicInfo)
    }

    fun updatePrivateInfo(privateInfo: PrivateInfo): User {
        return copy(privateInfo = privateInfo)
    }

    fun updateLogin(): User {
        return copy(metadata = metadata.updateLogin())
    }

    fun delete(): User {
        return copy(metadata = metadata.delete())
    }

    /**
     * 탈퇴 시 PII 즉시 익명화 — 앱스토어 심사 가이드 5.1.1(v) / GDPR / 정보통신망법 준수.
     * row 자체는 30일 보관 후 hard delete (운영 통계·재가입 차단 목적, RUNBOOK §탈퇴 참조).
     *
     * 익명화 대상: 실명·이메일·전화번호·닉네임·OAuth provider ID.
     * 비밀번호 해시는 BCrypt 라 추가 익명화 불필요 → 단순 null 처리.
     */
    fun anonymize(): User {
        val tag = id.value.toString().take(8)
        return copy(
            oauthInfo = null,
            password = null,
            privateInfo = privateInfo.copy(
                realName = "탈퇴회원",
                email = null,
                phoneNumber = null,
                isPhoneVerified = false,
                contactInfo = null,
            ),
            publicInfo = publicInfo.copy(nickname = "탈퇴회원_$tag"),
            metadata = metadata.delete(),
        )
    }

    fun verifyPhone(): User {
        return copy(privateInfo = privateInfo.verifyPhone())
    }
}
