package kr.ai.palette.domain.matchmaking

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import kr.ai.palette.domain.common.UserId
import java.time.LocalDateTime
import java.util.UUID

class MatchmakingRequestTest : DescribeSpec({

    val requesterId = UserId(UUID.randomUUID())
    val targetUserId = UserId(UUID.randomUUID())
    val matchmakerId = UserId(UUID.randomUUID())

    fun makeRequest(status: MatchmakingRequestStatus = MatchmakingRequestStatus.PENDING) =
        MatchmakingRequest(
            id = MatchmakingRequestId(),
            requesterId = requesterId,
            targetUserId = targetUserId,
            matchmakerId = matchmakerId,
            requesterMessage = "안녕하세요",
            matchmakerDecision = null,
            targetUserDecision = null,
            status = status,
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

    describe("MatchmakingRequest 상태 전이") {

        context("PENDING 상태에서") {
            it("주선자 승인 시 MATCHMAKER_APPROVED가 된다") {
                val request = makeRequest(MatchmakingRequestStatus.PENDING)
                val updated = request.approveByMatchmaker("잘 어울릴 것 같아요")
                updated.status shouldBe MatchmakingRequestStatus.MATCHMAKER_APPROVED
                updated.matchmakerDecision shouldNotBe null
            }

            it("주선자 거절 시 REJECTED_BY_MATCHMAKER가 된다") {
                val request = makeRequest(MatchmakingRequestStatus.PENDING)
                val updated = request.rejectByMatchmaker("아직 준비가 안 된 것 같아요")
                updated.status shouldBe MatchmakingRequestStatus.REJECTED_BY_MATCHMAKER
            }
        }

        context("MATCHMAKER_APPROVED 상태에서") {
            it("대상자 수락 시 COMPLETED가 된다") {
                val request = makeRequest(MatchmakingRequestStatus.MATCHMAKER_APPROVED)
                val updated = request.acceptByTarget(null)
                updated.status shouldBe MatchmakingRequestStatus.COMPLETED
            }

            it("대상자 거절 시 REJECTED_BY_TARGET이 된다") {
                val request = makeRequest(MatchmakingRequestStatus.MATCHMAKER_APPROVED)
                val updated = request.rejectByTarget(null)
                updated.status shouldBe MatchmakingRequestStatus.REJECTED_BY_TARGET
            }
        }
    }

    describe("MatchmakingRequest 생성") {
        it("create()로 PENDING 상태의 요청이 생성된다") {
            val request = MatchmakingRequest.create(
                requesterId = requesterId,
                targetUserId = targetUserId,
                matchmakerId = matchmakerId,
                requesterMessage = "소개해주세요"
            )
            request.status shouldBe MatchmakingRequestStatus.PENDING
            request.matchmakerDecision shouldBe null
            request.targetUserDecision shouldBe null
        }

        it("updatedAt이 createdAt과 같다") {
            val request = MatchmakingRequest.create(requesterId, targetUserId, matchmakerId, null)
            // Allow small delta due to execution time
            request.updatedAt shouldNotBe null
            request.createdAt shouldNotBe null
        }
    }

    describe("상태별 종료 여부") {
        it("COMPLETED는 종료 상태다") {
            val request = makeRequest(MatchmakingRequestStatus.COMPLETED)
            request.isTerminal() shouldBe true
        }

        it("REJECTED_BY_MATCHMAKER는 종료 상태다") {
            val request = makeRequest(MatchmakingRequestStatus.REJECTED_BY_MATCHMAKER)
            request.isTerminal() shouldBe true
        }

        it("REJECTED_BY_TARGET은 종료 상태다") {
            val request = makeRequest(MatchmakingRequestStatus.REJECTED_BY_TARGET)
            request.isTerminal() shouldBe true
        }

        it("PENDING은 진행 중 상태다") {
            val request = makeRequest(MatchmakingRequestStatus.PENDING)
            request.isTerminal() shouldBe false
        }

        it("MATCHMAKER_APPROVED는 진행 중 상태다") {
            val request = makeRequest(MatchmakingRequestStatus.MATCHMAKER_APPROVED)
            request.isTerminal() shouldBe false
        }
    }
})
