package kr.ai.palette.presentation.feed

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.AccountType
import kr.ai.palette.persistence.feed.FeedHideEntity
import kr.ai.palette.persistence.feed.FeedHideJpaRepository
import java.util.UUID

class FeedHideControllerTest : DescribeSpec({

    val savedEntity = FeedHideEntity(userId = "any", targetUserId = "any")
    val repository = mockk<FeedHideJpaRepository>()
    val controller = FeedHideController(repository)

    beforeEach { clearMocks(repository) }

    fun authUser(id: UUID = UUID.randomUUID()) = AuthUser(UserId(id), "test", AccountType.REGULAR, false)

    describe("FeedHideController") {

        context("프로필 숨기기") {
            it("hide() — 이미 없으면 새로 저장한다") {
                val user = authUser()
                val targetId = UUID.randomUUID()

                every { repository.existsByUserIdAndTargetUserId(any(), any()) } returns false
                every { repository.save(any<FeedHideEntity>()) } returns savedEntity

                controller.hide(user, targetId.toString())

                verify { repository.save(any<FeedHideEntity>()) }
            }

            it("hide() — 이미 숨겨져 있으면 저장하지 않는다") {
                val user = authUser()
                val targetId = UUID.randomUUID()

                every { repository.existsByUserIdAndTargetUserId(any(), any()) } returns true

                controller.hide(user, targetId.toString())

                verify(exactly = 0) { repository.save(any<FeedHideEntity>()) }
            }
        }

        context("숨김 해제") {
            it("unhide() — repository.deleteByUserIdAndTargetUserId를 호출한다") {
                val user = authUser()
                val targetId = UUID.randomUUID()

                every { repository.deleteByUserIdAndTargetUserId(any(), any()) } returns Unit

                controller.unhide(user, targetId.toString())

                verify {
                    repository.deleteByUserIdAndTargetUserId(
                        user.userId.value.toString(), targetId.toString()
                    )
                }
            }
        }

        context("숨긴 목록 조회") {
            it("list() — repository에서 목록을 반환한다") {
                val user = authUser()
                val targetId = UUID.randomUUID()

                every { repository.findAllByUserId(any()) } returns
                    listOf(FeedHideEntity(userId = user.userId.value.toString(), targetUserId = targetId.toString()))

                val response = controller.list(user)

                response.body!!.hiddenUserIds shouldBe listOf(targetId.toString())
            }

            it("숨긴 프로필이 없으면 빈 목록을 반환한다") {
                val user = authUser()

                every { repository.findAllByUserId(any()) } returns emptyList()

                val response = controller.list(user)

                response.body!!.hiddenUserIds shouldBe emptyList()
            }
        }
    }
})
