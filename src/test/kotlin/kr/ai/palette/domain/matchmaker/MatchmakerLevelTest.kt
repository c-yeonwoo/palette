package kr.ai.palette.domain.matchmaker

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.doubles.shouldBeExactly

class MatchmakerLevelTest : DescribeSpec({

    describe("MatchmakerLevel.calculateLevel") {

        context("성사 건수 0~2건") {
            it("레벨 1, 커미션 30%") {
                val stats = MatchmakerStats.initial()
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 1
                level.commissionRate shouldBeExactly 0.30
            }

            it("성사 2건도 레벨 1") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 2)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 1
            }
        }

        context("성사 건수 3~5건") {
            it("레벨 2, 커미션 35%") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 3)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 2
                level.commissionRate shouldBeExactly 0.35
            }

            it("성사 5건도 레벨 2") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 5)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 2
            }
        }

        context("성사 건수 6~10건") {
            it("레벨 3, 커미션 40%") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 6)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 3
                level.commissionRate shouldBeExactly 0.40
            }
        }

        context("성사 건수 11~20건") {
            it("레벨 4, 커미션 45%") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 11)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 4
                level.commissionRate shouldBeExactly 0.45
            }
        }

        context("성사 건수 21건 이상") {
            it("레벨 5, 커미션 50%") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 21)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 5
                level.commissionRate shouldBeExactly 0.50
            }

            it("매우 많은 건수도 레벨 5") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 999)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 5
            }
        }
    }

    describe("MatchmakerLevel.initial") {
        it("초기 레벨은 1, 커미션 30%") {
            val level = MatchmakerLevel.initial()
            level.level shouldBe 1
            level.commissionRate shouldBeExactly 0.30
        }
    }
})
