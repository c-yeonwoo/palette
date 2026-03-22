package kr.ai.palette.presentation.feed

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.collections.shouldNotContain
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.AccountType
import java.util.UUID

class FeedHideControllerTest : DescribeSpec({

    // Reset store before each test by using unique user IDs per test
    val controller = FeedHideController()

    fun authUser(id: UUID = UUID.randomUUID()) = AuthUser(UserId(id), "test", AccountType.REGULAR, false)

    describe("FeedHideController") {

        context("프로필 숨기기") {
            it("hide() 호출 시 isHidden이 true가 된다") {
                val user = authUser()
                val targetId = UUID.randomUUID()
                controller.hide(user, targetId.toString())

                FeedHideController.isHidden(user.userId, UserId(targetId)) shouldBe true
            }

            it("숨기지 않은 프로필은 isHidden이 false다") {
                val user = authUser()
                val targetId = UUID.randomUUID()

                FeedHideController.isHidden(user.userId, UserId(targetId)) shouldBe false
            }

            it("여러 프로필을 숨길 수 있다") {
                val user = authUser()
                val target1 = UUID.randomUUID()
                val target2 = UUID.randomUUID()

                controller.hide(user, target1.toString())
                controller.hide(user, target2.toString())

                val hidden = FeedHideController.getHiddenIds(user.userId)
                hidden shouldContain target1.toString()
                hidden shouldContain target2.toString()
            }
        }

        context("숨김 해제") {
            it("unhide() 호출 시 isHidden이 false가 된다") {
                val user = authUser()
                val targetId = UUID.randomUUID()

                controller.hide(user, targetId.toString())
                FeedHideController.isHidden(user.userId, UserId(targetId)) shouldBe true

                controller.unhide(user, targetId.toString())
                FeedHideController.isHidden(user.userId, UserId(targetId)) shouldBe false
            }

            it("숨김 해제 후 다른 숨김은 유지된다") {
                val user = authUser()
                val target1 = UUID.randomUUID()
                val target2 = UUID.randomUUID()

                controller.hide(user, target1.toString())
                controller.hide(user, target2.toString())
                controller.unhide(user, target1.toString())

                FeedHideController.isHidden(user.userId, UserId(target1)) shouldBe false
                FeedHideController.isHidden(user.userId, UserId(target2)) shouldBe true
            }
        }

        context("숨긴 목록 조회") {
            it("list()는 숨긴 프로필 ID 목록을 반환한다") {
                val user = authUser()
                val targetId = UUID.randomUUID()

                controller.hide(user, targetId.toString())
                val response = controller.list(user)

                response.body!!.hiddenUserIds shouldContain targetId.toString()
            }

            it("숨긴 프로필이 없으면 빈 목록을 반환한다") {
                val user = authUser()
                val response = controller.list(user)

                response.body!!.hiddenUserIds shouldBe emptyList()
            }
        }

        context("사용자 간 격리") {
            it("다른 사용자의 숨김은 내 숨김에 영향을 주지 않는다") {
                val user1 = authUser()
                val user2 = authUser()
                val targetId = UUID.randomUUID()

                controller.hide(user1, targetId.toString())

                FeedHideController.isHidden(user1.userId, UserId(targetId)) shouldBe true
                FeedHideController.isHidden(user2.userId, UserId(targetId)) shouldBe false
            }
        }
    }
})
