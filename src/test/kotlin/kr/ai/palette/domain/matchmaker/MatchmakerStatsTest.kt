package kr.ai.palette.domain.matchmaker

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.doubles.shouldBeExactly

class MatchmakerStatsTest : DescribeSpec({

    describe("MatchmakerStats") {

        context("초기 상태") {
            it("모든 카운터가 0이어야 한다") {
                val stats = MatchmakerStats.initial()
                stats.totalMatchRequests shouldBe 0
                stats.approvedRequests shouldBe 0
                stats.rejectedRequests shouldBe 0
                stats.successfulMatches shouldBe 0
                stats.failedMatches shouldBe 0
            }

            it("초기 성사율은 0.0이어야 한다") {
                val stats = MatchmakerStats.initial()
                stats.getSuccessRate() shouldBeExactly 0.0
            }
        }

        context("카운터 증가") {
            it("incrementTotal은 totalMatchRequests만 증가시킨다") {
                val stats = MatchmakerStats.initial().incrementTotal()
                stats.totalMatchRequests shouldBe 1
                stats.approvedRequests shouldBe 0
            }

            it("incrementApproved는 approvedRequests만 증가시킨다") {
                val stats = MatchmakerStats.initial().incrementApproved()
                stats.approvedRequests shouldBe 1
                stats.totalMatchRequests shouldBe 0
            }

            it("incrementSuccess는 successfulMatches만 증가시킨다") {
                val stats = MatchmakerStats.initial().incrementSuccess()
                stats.successfulMatches shouldBe 1
                stats.failedMatches shouldBe 0
            }

            it("여러 번 체이닝할 수 있다") {
                val stats = MatchmakerStats.initial()
                    .incrementTotal()
                    .incrementTotal()
                    .incrementApproved()
                stats.totalMatchRequests shouldBe 2
                stats.approvedRequests shouldBe 1
            }
        }

        context("성사율 계산") {
            it("성사 2건, 실패 2건 → 50%") {
                val stats = MatchmakerStats.initial()
                    .copy(successfulMatches = 2, failedMatches = 2)
                stats.getSuccessRate() shouldBeExactly 0.5
            }

            it("성사 3건, 실패 0건 → 100%") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 3)
                stats.getSuccessRate() shouldBeExactly 1.0
            }

            it("성사 0건, 실패 0건 → 0% (division by zero 방지)") {
                val stats = MatchmakerStats.initial()
                stats.getSuccessRate() shouldBeExactly 0.0
            }
        }
    }
})
