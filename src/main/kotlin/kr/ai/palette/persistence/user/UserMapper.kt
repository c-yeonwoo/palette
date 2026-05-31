package kr.ai.palette.persistence.user

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.*
import org.springframework.stereotype.Component

@Component
class UserMapper {

    fun toDomain(entity: UserEntity): User {
        val oauthProvider = entity.oauthProvider
        val oauthId = entity.oauthId

        return User(
            id = UserId(entity.id),
            oauthInfo = if (oauthProvider != null && oauthId != null) {
                OAuthInfo(
                    provider = oauthProvider.toDomain(),
                    oauthId = oauthId
                )
            } else null,
            password = entity.password,
            privateInfo = PrivateInfo(
                realName = entity.realName,
                email = entity.email,
                phoneNumber = entity.phoneNumber,
                isPhoneVerified = entity.isPhoneVerified,
                contactInfo = if (entity.phoneNumber != null) {
                    ContactInfo(
                        phoneNumber = entity.phoneNumber!!,
                        kakaoTalkId = entity.kakaoTalkId,
                        preferredContactMethod = entity.preferredContactMethod?.toDomain()
                    )
                } else null
            ),
            publicInfo = PublicInfo(
                nickname = entity.nickname,
                birthDate = entity.birthDate,
                gender = entity.gender.toDomain()
            ),
            accountType = entity.accountType.toDomain(),
            isProfileCompleted = entity.isProfileCompleted,
            termsAgreement = TermsAgreement(
                agreedTermsService = entity.agreedTermsService,
                agreedTermsPrivacy = entity.agreedTermsPrivacy,
                agreedMarketing = entity.agreedMarketing,
                agreedAt = entity.agreedAt
            ),
            metadata = UserMetadata(
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt,
                lastLoginAt = entity.lastLoginAt,
                deletedAt = entity.deletedAt
            ),
            role = entity.role.toDomain(),
        )
    }

    fun toEntity(domain: User): UserEntity {
        return UserEntity(
            id = domain.id.value,
            oauthProvider = domain.oauthInfo?.provider?.toEntity(),
            oauthId = domain.oauthInfo?.oauthId,
            password = domain.password,
            realName = domain.privateInfo.realName,
            email = domain.privateInfo.email,
            phoneNumber = domain.privateInfo.phoneNumber,
            isPhoneVerified = domain.privateInfo.isPhoneVerified,
            kakaoTalkId = domain.privateInfo.contactInfo?.kakaoTalkId,
            preferredContactMethod = domain.privateInfo.contactInfo?.preferredContactMethod?.toEntity(),
            nickname = domain.publicInfo.nickname,
            birthDate = domain.publicInfo.birthDate,
            gender = domain.publicInfo.gender.toEntity(),
            accountType = domain.accountType.toEntity(),
            isProfileCompleted = domain.isProfileCompleted,
            agreedTermsService = domain.termsAgreement.agreedTermsService,
            agreedTermsPrivacy = domain.termsAgreement.agreedTermsPrivacy,
            agreedMarketing = domain.termsAgreement.agreedMarketing,
            agreedAt = domain.termsAgreement.agreedAt,
            createdAt = domain.metadata.createdAt,
            updatedAt = domain.metadata.updatedAt,
            lastLoginAt = domain.metadata.lastLoginAt,
            deletedAt = domain.metadata.deletedAt,
            role = domain.role.toEntity(),
        )
    }

    fun updateEntity(entity: UserEntity, domain: User) {
        entity.oauthProvider = domain.oauthInfo?.provider?.toEntity()
        entity.oauthId = domain.oauthInfo?.oauthId
        entity.password = domain.password
        entity.realName = domain.privateInfo.realName
        entity.email = domain.privateInfo.email
        entity.phoneNumber = domain.privateInfo.phoneNumber
        entity.isPhoneVerified = domain.privateInfo.isPhoneVerified
        entity.kakaoTalkId = domain.privateInfo.contactInfo?.kakaoTalkId
        entity.preferredContactMethod = domain.privateInfo.contactInfo?.preferredContactMethod?.toEntity()
        entity.nickname = domain.publicInfo.nickname
        entity.birthDate = domain.publicInfo.birthDate
        entity.gender = domain.publicInfo.gender.toEntity()
        entity.accountType = domain.accountType.toEntity()
        entity.isProfileCompleted = domain.isProfileCompleted
        entity.agreedTermsService = domain.termsAgreement.agreedTermsService
        entity.agreedTermsPrivacy = domain.termsAgreement.agreedTermsPrivacy
        entity.agreedMarketing = domain.termsAgreement.agreedMarketing
        entity.agreedAt = domain.termsAgreement.agreedAt
        entity.updatedAt = domain.metadata.updatedAt
        entity.lastLoginAt = domain.metadata.lastLoginAt
        entity.deletedAt = domain.metadata.deletedAt
        entity.role = domain.role.toEntity()
    }
}

// Extension functions for enum conversion
private fun OAuthProviderEntity.toDomain(): OAuthProvider {
    return OAuthProvider.valueOf(this.name)
}

private fun OAuthProvider.toEntity(): OAuthProviderEntity {
    return OAuthProviderEntity.valueOf(this.name)
}

private fun GenderEntity.toDomain(): Gender {
    return Gender.valueOf(this.name)
}

private fun Gender.toEntity(): GenderEntity {
    return GenderEntity.valueOf(this.name)
}

private fun AccountTypeEntity.toDomain(): AccountType {
    return AccountType.valueOf(this.name)
}

private fun AccountType.toEntity(): AccountTypeEntity {
    return AccountTypeEntity.valueOf(this.name)
}

private fun ContactMethodEntity.toDomain(): ContactMethod {
    return ContactMethod.valueOf(this.name)
}

private fun ContactMethod.toEntity(): ContactMethodEntity {
    return ContactMethodEntity.valueOf(this.name)
}

private fun UserRoleEntity.toDomain(): UserRole = UserRole.valueOf(this.name)
private fun UserRole.toEntity(): UserRoleEntity = UserRoleEntity.valueOf(this.name)
