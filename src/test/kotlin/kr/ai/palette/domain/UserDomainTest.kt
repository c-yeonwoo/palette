package kr.ai.palette.domain

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.*
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

class UserDomainTest : DescribeSpec({

    fun makeUser(
        accountType: AccountType = AccountType.REGULAR,
        isProfileCompleted: Boolean = false,
        isPhoneVerified: Boolean = true,
        isDeleted: Boolean = false
    ): User {
        val now = Instant.now()
        return User(
            id = UserId(UUID.randomUUID()),
            oauthInfo = null,
            password = "hashed_password",
            privateInfo = PrivateInfo(
                realName = "홍길동",
                email = "hong@example.com",
                phoneNumber = "010-1234-5678",
                isPhoneVerified = isPhoneVerified,
                contactInfo = null
            ),
            publicInfo = PublicInfo(
                nickname = "길동이",
                birthDate = LocalDate.of(1995, 5, 15),
                gender = Gender.MALE
            ),
            accountType = accountType,
            isProfileCompleted = isProfileCompleted,
            termsAgreement = TermsAgreement(
                agreedTermsService = true,
                agreedTermsPrivacy = true,
                agreedMarketing = false,
                agreedAt = now
            ),
            metadata = UserMetadata(
                createdAt = now,
                updatedAt = now,
                lastLoginAt = now,
                deletedAt = if (isDeleted) now else null
            )
        )
    }

    describe("User.canUseMatchingService()") {

        it("REGULAR + 프로필 완성 + 삭제 안됨 → true") {
            val user = makeUser(AccountType.REGULAR, isProfileCompleted = true)
            user.canUseMatchingService() shouldBe true
        }

        it("REGULAR + 프로필 미완성 → false") {
            val user = makeUser(AccountType.REGULAR, isProfileCompleted = false)
            user.canUseMatchingService() shouldBe false
        }

        it("MATCHMAKER_ONLY → false") {
            val user = makeUser(AccountType.MATCHMAKER_ONLY, isProfileCompleted = true)
            user.canUseMatchingService() shouldBe false
        }

        it("탈퇴한 사용자 → false") {
            val user = makeUser(AccountType.REGULAR, isProfileCompleted = true, isDeleted = true)
            user.canUseMatchingService() shouldBe false
        }
    }

    describe("User.canBeMatchmaker()") {

        it("핸드폰 인증 완료 + 삭제 안됨 → true") {
            val user = makeUser(isPhoneVerified = true)
            user.canBeMatchmaker() shouldBe true
        }

        it("핸드폰 인증 미완료 → false") {
            val user = makeUser(isPhoneVerified = false)
            user.canBeMatchmaker() shouldBe false
        }

        it("탈퇴한 사용자 → false") {
            val user = makeUser(isPhoneVerified = true, isDeleted = true)
            user.canBeMatchmaker() shouldBe false
        }
    }

    describe("User.completeProfile()") {

        it("REGULAR 유저는 프로필을 완성할 수 있다") {
            val user = makeUser(AccountType.REGULAR, isProfileCompleted = false)
            val completed = user.completeProfile()
            completed.isProfileCompleted shouldBe true
        }

        it("MATCHMAKER_ONLY 유저는 프로필을 완성할 수 없다 (예외 발생)") {
            val user = makeUser(AccountType.MATCHMAKER_ONLY, isProfileCompleted = false)
            shouldThrow<IllegalArgumentException> {
                user.completeProfile()
            }
        }
    }

    describe("User.verifyPhone()") {

        it("verifyPhone() 후 isPhoneVerified가 true가 된다") {
            val user = makeUser(isPhoneVerified = false)
            val verified = user.verifyPhone()
            verified.privateInfo.isPhoneVerified shouldBe true
        }

        it("verifyPhone() 호출 후 다른 필드는 변경되지 않는다") {
            val user = makeUser(isPhoneVerified = false)
            val verified = user.verifyPhone()
            verified.publicInfo shouldBe user.publicInfo
            verified.accountType shouldBe user.accountType
        }
    }

    describe("User.delete()") {

        it("delete() 후 metadata.isDeleted()가 true가 된다") {
            val user = makeUser()
            val deleted = user.delete()
            deleted.metadata.isDeleted() shouldBe true
        }

        it("delete() 후 deletedAt이 null이 아니다") {
            val user = makeUser()
            val deleted = user.delete()
            deleted.metadata.deletedAt shouldNotBe null
        }
    }

    describe("User.updateLogin()") {

        it("updateLogin() 후 lastLoginAt이 갱신된다") {
            val user = makeUser()
            val originalLoginAt = user.metadata.lastLoginAt
            Thread.sleep(10)
            val updated = user.updateLogin()
            updated.metadata.lastLoginAt shouldNotBe originalLoginAt
        }
    }

    describe("PublicInfo.getAge()") {

        it("오늘 이전에 생일이면 나이가 올바르게 계산된다") {
            val birthDate = LocalDate.now().minusYears(25).minusDays(1)
            val publicInfo = PublicInfo(nickname = "테스터", birthDate = birthDate, gender = Gender.FEMALE)
            publicInfo.getAge() shouldBe 25
        }

        it("아직 생일이 지나지 않았으면 나이가 1살 적다") {
            val birthDate = LocalDate.now().minusYears(25).plusDays(1)
            val publicInfo = PublicInfo(nickname = "테스터", birthDate = birthDate, gender = Gender.FEMALE)
            publicInfo.getAge() shouldBe 24
        }
    }

    describe("PrivateInfo.verifyPhone()") {

        it("phoneNumber가 있으면 인증 성공") {
            val info = PrivateInfo(
                realName = "홍길동",
                email = null,
                phoneNumber = "010-1234-5678",
                isPhoneVerified = false,
                contactInfo = null
            )
            val verified = info.verifyPhone()
            verified.isPhoneVerified shouldBe true
        }

        it("phoneNumber가 없으면 예외 발생") {
            val info = PrivateInfo(
                realName = "홍길동",
                email = null,
                phoneNumber = null,
                isPhoneVerified = false,
                contactInfo = null
            )
            shouldThrow<IllegalArgumentException> {
                info.verifyPhone()
            }
        }
    }
})
