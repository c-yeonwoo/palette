package kr.ai.palette.domain

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.AccountType
import java.util.UUID

class AuthUserTest : DescribeSpec({

    fun makeAuthUser(
        accountType: AccountType = AccountType.REGULAR,
        isProfileCompleted: Boolean = true
    ) = AuthUser(
        userId = UserId(UUID.randomUUID()),
        nickname = "테스터",
        accountType = accountType,
        isProfileCompleted = isProfileCompleted
    )

    describe("AuthUser.canAccessMatchingService()") {

        it("REGULAR + 프로필 완성 → true") {
            val user = makeAuthUser(AccountType.REGULAR, isProfileCompleted = true)
            user.canAccessMatchingService() shouldBe true
        }

        it("REGULAR + 프로필 미완성 → false") {
            val user = makeAuthUser(AccountType.REGULAR, isProfileCompleted = false)
            user.canAccessMatchingService() shouldBe false
        }

        it("MATCHMAKER_ONLY + 프로필 완성 → false") {
            val user = makeAuthUser(AccountType.MATCHMAKER_ONLY, isProfileCompleted = true)
            user.canAccessMatchingService() shouldBe false
        }

        it("MATCHMAKER_ONLY + 프로필 미완성 → false") {
            val user = makeAuthUser(AccountType.MATCHMAKER_ONLY, isProfileCompleted = false)
            user.canAccessMatchingService() shouldBe false
        }
    }

    describe("AuthUser.canAccessMatchmakerService()") {

        it("REGULAR 계정도 주선자 서비스를 이용할 수 있다") {
            val user = makeAuthUser(AccountType.REGULAR)
            user.canAccessMatchmakerService() shouldBe true
        }

        it("MATCHMAKER_ONLY 계정도 주선자 서비스를 이용할 수 있다") {
            val user = makeAuthUser(AccountType.MATCHMAKER_ONLY)
            user.canAccessMatchmakerService() shouldBe true
        }
    }

    describe("AuthUser.anonymous()") {
        it("anonymous() 팩토리 메서드는 REGULAR 계정을 생성한다") {
            val anon = AuthUser.anonymous()
            anon.accountType shouldBe AccountType.REGULAR
        }

        it("anonymous()는 프로필 미완성 상태다") {
            val anon = AuthUser.anonymous()
            anon.isProfileCompleted shouldBe false
        }

        it("anonymous() 닉네임은 'anonymous'다") {
            val anon = AuthUser.anonymous()
            anon.nickname shouldBe "anonymous"
        }
    }
})
