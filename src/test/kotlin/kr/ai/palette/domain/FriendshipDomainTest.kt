package kr.ai.palette.domain

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.Friendship
import kr.ai.palette.domain.friendship.FriendshipId
import kr.ai.palette.domain.friendship.FriendshipStatus
import java.time.Instant
import java.util.UUID

class FriendshipDomainTest : DescribeSpec({

    val user1Id = UserId(UUID.randomUUID())
    val user2Id = UserId(UUID.randomUUID())

    fun pendingFriendship() = Friendship(
        id = FriendshipId.generate(),
        user1Id = user1Id,
        user2Id = user2Id,
        status = FriendshipStatus.PENDING,
        createdAt = Instant.now(),
        acceptedAt = null
    )

    describe("Friendship.accept()") {

        context("PENDING 상태에서") {
            it("accept() 호출 시 상태가 ACCEPTED로 변경된다") {
                val friendship = pendingFriendship()
                val accepted = friendship.accept(Instant.now())
                accepted.status shouldBe FriendshipStatus.ACCEPTED
            }

            it("accept() 호출 시 acceptedAt이 설정된다") {
                val friendship = pendingFriendship()
                val acceptedAt = Instant.now()
                val accepted = friendship.accept(acceptedAt)
                accepted.acceptedAt shouldBe acceptedAt
            }

            it("accept() 호출 시 user1Id와 user2Id는 변경되지 않는다") {
                val friendship = pendingFriendship()
                val accepted = friendship.accept(Instant.now())
                accepted.user1Id shouldBe user1Id
                accepted.user2Id shouldBe user2Id
            }
        }

        context("이미 ACCEPTED 상태에서") {
            it("accept() 호출 시 예외가 발생한다") {
                val acceptedAt = Instant.now()
                val acceptedFriendship = Friendship(
                    id = FriendshipId.generate(),
                    user1Id = user1Id,
                    user2Id = user2Id,
                    status = FriendshipStatus.ACCEPTED,
                    createdAt = Instant.now(),
                    acceptedAt = acceptedAt
                )
                shouldThrow<IllegalArgumentException> {
                    acceptedFriendship.accept(Instant.now())
                }
            }
        }
    }

    describe("Friendship.getOtherUserId()") {

        it("user1Id를 전달하면 user2Id가 반환된다") {
            val friendship = pendingFriendship()
            friendship.getOtherUserId(user1Id) shouldBe user2Id
        }

        it("user2Id를 전달하면 user1Id가 반환된다") {
            val friendship = pendingFriendship()
            friendship.getOtherUserId(user2Id) shouldBe user1Id
        }

        it("관계에 없는 userId를 전달하면 예외가 발생한다") {
            val friendship = pendingFriendship()
            val strangerUserId = UserId(UUID.randomUUID())
            shouldThrow<IllegalArgumentException> {
                friendship.getOtherUserId(strangerUserId)
            }
        }
    }

    describe("Friendship.isFriendWith()") {

        it("ACCEPTED 상태에서 user1Id로 확인하면 true를 반환한다") {
            val acceptedAt = Instant.now()
            val friendship = Friendship(
                id = FriendshipId.generate(),
                user1Id = user1Id,
                user2Id = user2Id,
                status = FriendshipStatus.ACCEPTED,
                createdAt = Instant.now(),
                acceptedAt = acceptedAt
            )
            friendship.isFriendWith(user1Id) shouldBe true
        }

        it("ACCEPTED 상태에서 user2Id로 확인하면 true를 반환한다") {
            val acceptedAt = Instant.now()
            val friendship = Friendship(
                id = FriendshipId.generate(),
                user1Id = user1Id,
                user2Id = user2Id,
                status = FriendshipStatus.ACCEPTED,
                createdAt = Instant.now(),
                acceptedAt = acceptedAt
            )
            friendship.isFriendWith(user2Id) shouldBe true
        }

        it("PENDING 상태에서는 false를 반환한다") {
            val friendship = pendingFriendship()
            friendship.isFriendWith(user1Id) shouldBe false
        }

        it("관계에 없는 userId는 false를 반환한다") {
            val acceptedAt = Instant.now()
            val friendship = Friendship(
                id = FriendshipId.generate(),
                user1Id = user1Id,
                user2Id = user2Id,
                status = FriendshipStatus.ACCEPTED,
                createdAt = Instant.now(),
                acceptedAt = acceptedAt
            )
            val strangerUserId = UserId(UUID.randomUUID())
            friendship.isFriendWith(strangerUserId) shouldBe false
        }
    }

    describe("Friendship 생성 규칙") {

        it("자기 자신과 친구 관계를 만들면 예외가 발생한다") {
            val sameUserId = UserId(UUID.randomUUID())
            shouldThrow<IllegalArgumentException> {
                Friendship(
                    id = FriendshipId.generate(),
                    user1Id = sameUserId,
                    user2Id = sameUserId,
                    status = FriendshipStatus.PENDING,
                    createdAt = Instant.now(),
                    acceptedAt = null
                )
            }
        }

        it("ACCEPTED 상태인데 acceptedAt이 null이면 예외가 발생한다") {
            shouldThrow<IllegalArgumentException> {
                Friendship(
                    id = FriendshipId.generate(),
                    user1Id = user1Id,
                    user2Id = user2Id,
                    status = FriendshipStatus.ACCEPTED,
                    createdAt = Instant.now(),
                    acceptedAt = null
                )
            }
        }
    }

    describe("FriendshipId.generate()") {
        it("generate()를 두 번 호출하면 서로 다른 ID가 생성된다") {
            val id1 = FriendshipId.generate()
            val id2 = FriendshipId.generate()
            id1 shouldNotBe id2
        }
    }
})
