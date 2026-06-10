package kr.ai.palette.domain

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.doubles.shouldBeExactly
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaker.*
import java.time.Instant
import java.util.UUID

class MatchmakerDomainTest : DescribeSpec({

    fun makeMatchmaker(successfulMatches: Int = 0): Matchmaker {
        val now = Instant.now()
        val stats = MatchmakerStats.initial().copy(successfulMatches = successfulMatches)
        return Matchmaker(
            id = MatchmakerId(UUID.randomUUID()),
            userId = UserId(UUID.randomUUID()),
            stats = stats,
            level = MatchmakerLevel.calculateLevel(stats),
            earnings = MatchmakerEarnings.initial(),
            profilePhoto = null,
            metadata = MatchmakerMetadata(createdAt = now, updatedAt = now)
        )
    }

    describe("Matchmaker.recordMatchSuccess()") {

        it("성공 건수가 1 증가한다") {
            val matchmaker = makeMatchmaker(0)
            val updated = matchmaker.recordMatchSuccess()
            updated.stats.successfulMatches shouldBe 1
        }

        it("성공 시 현재 등급 분배율 × INTRO_REQUEST(100) 적립 — Lv.1 = 15 물감 (ADR 0044)") {
            val matchmaker = makeMatchmaker(0)
            matchmaker.level.level shouldBe 1
            val updated = matchmaker.recordMatchSuccess()
            updated.earnings.totalPoints shouldBe 15
        }

        it("Lv.5 다이아 분배율 40% × 100 = 40 물감 적립 (ADR 0044)") {
            val matchmaker = makeMatchmaker(successfulMatches = 150)
            matchmaker.level.level shouldBe 5
            val updated = matchmaker.recordMatchSuccess()
            updated.earnings.totalPoints shouldBe 40
        }

        it("14건 → 15건 성공 시 레벨이 1에서 2로 올라간다 (ADR 0038 강화 스케줄)") {
            val matchmaker = makeMatchmaker(successfulMatches = 14)
            matchmaker.level.level shouldBe 1
            val updated = matchmaker.recordMatchSuccess()
            updated.level.level shouldBe 2
        }

        it("39건 → 40건 성공 시 레벨이 2에서 3으로 올라간다 (ADR 0038 강화 스케줄)") {
            val matchmaker = makeMatchmaker(successfulMatches = 39)
            matchmaker.level.level shouldBe 2
            val updated = matchmaker.recordMatchSuccess()
            updated.level.level shouldBe 3
        }

        it("성공 후 metadata.updatedAt이 갱신된다") {
            val matchmaker = makeMatchmaker(0)
            Thread.sleep(10)
            val updated = matchmaker.recordMatchSuccess()
            updated.metadata.updatedAt shouldNotBe matchmaker.metadata.updatedAt
        }
    }

    describe("Matchmaker.recordMatchRequest()") {
        it("totalMatchRequests가 1 증가한다") {
            val matchmaker = makeMatchmaker()
            val updated = matchmaker.recordMatchRequest()
            updated.stats.totalMatchRequests shouldBe 1
        }
    }

    describe("Matchmaker.recordMatchApproval()") {
        it("approvedRequests가 1 증가한다") {
            val matchmaker = makeMatchmaker()
            val updated = matchmaker.recordMatchApproval()
            updated.stats.approvedRequests shouldBe 1
        }
    }

    describe("Matchmaker.recordMatchRejection()") {
        it("rejectedRequests가 1 증가한다") {
            val matchmaker = makeMatchmaker()
            val updated = matchmaker.recordMatchRejection()
            updated.stats.rejectedRequests shouldBe 1
        }
    }

    describe("Matchmaker.recordMatchFailure()") {
        it("failedMatches가 1 증가한다") {
            val matchmaker = makeMatchmaker()
            val updated = matchmaker.recordMatchFailure()
            updated.stats.failedMatches shouldBe 1
        }
    }

    describe("Matchmaker.canEarnCommission()") {

        it("레벨 1(커미션 15%)에서 true를 반환한다 (ADR 0044)") {
            val matchmaker = makeMatchmaker(0)
            matchmaker.level.level shouldBe 1
            matchmaker.canEarnCommission() shouldBe true
        }

        it("레벨 5(커미션 40%)에서도 true를 반환한다 (ADR 0044)") {
            val matchmaker = makeMatchmaker(successfulMatches = 150)
            matchmaker.level.level shouldBe 5
            matchmaker.canEarnCommission() shouldBe true
        }
    }

    describe("Matchmaker.uploadPhoto()") {

        it("hasProfile=false인 경우 photoUrl이 저장된다") {
            val matchmaker = makeMatchmaker()
            val updated = matchmaker.uploadPhoto("https://example.com/photo.jpg", hasProfile = false)
            updated.profilePhoto shouldNotBe null
            updated.profilePhoto?.url shouldBe "https://example.com/photo.jpg"
        }

        it("hasProfile=true인 경우 profilePhoto가 변경되지 않는다") {
            val matchmaker = makeMatchmaker()
            val original = matchmaker.profilePhoto
            val updated = matchmaker.uploadPhoto("https://example.com/photo.jpg", hasProfile = true)
            updated.profilePhoto shouldBe original
        }
    }

    describe("MatchmakerLevel 경계값 검증") {

        it("성공 건수 경계: 0건 → Lv1, 15건 → Lv2, 40건 → Lv3, 70건 → Lv4, 150건 → Lv5 (ADR 0038 강화)") {
            val cases = listOf(
                0 to 1,
                14 to 1,
                15 to 2,
                39 to 2,
                40 to 3,
                69 to 3,
                70 to 4,
                149 to 4,
                150 to 5,
                500 to 5
            )
            cases.forEach { (matches, expectedLevel) ->
                val stats = MatchmakerStats.initial().copy(successfulMatches = matches)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe expectedLevel
            }
        }

        it("커미션율 경계: Lv1=15%, Lv2=20%, Lv3=25%, Lv4=30%, Lv5=40% (ADR 0044)") {
            val cases = listOf(
                0 to 0.15,
                15 to 0.20,
                40 to 0.25,
                70 to 0.30,
                150 to 0.40
            )
            cases.forEach { (matches, expectedRate) ->
                val stats = MatchmakerStats.initial().copy(successfulMatches = matches)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.commissionRate shouldBeExactly expectedRate
            }
        }
    }
})
