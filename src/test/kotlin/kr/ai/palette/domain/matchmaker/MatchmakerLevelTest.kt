package kr.ai.palette.domain.matchmaker

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.doubles.shouldBeExactly

/**
 * ADR 0044 (가격 v2) — 커미션 30~50% → 15~40% 로 재조정.
 *   Lv.1: 15% / Lv.2: 20% / Lv.3: 25% / Lv.4: 30% / Lv.5: 40%
 *
 * 소개 요청(100 물감) × 등급별 분배율 = 매칭당 보상 (15·20·25·30·40 물감).
 */
class MatchmakerLevelTest : DescribeSpec({

    describe("MatchmakerLevel.calculateLevel") {

        context("성사 건수 0~2건") {
            it("레벨 1, 커미션 15% (ADR 0044)") {
                val stats = MatchmakerStats.initial()
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 1
                level.commissionRate shouldBeExactly 0.15
            }

            it("성사 2건도 레벨 1") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 2)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 1
            }
        }

        context("성사 건수 3~5건") {
            it("레벨 2, 커미션 20% (ADR 0044)") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 3)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 2
                level.commissionRate shouldBeExactly 0.20
            }

            it("성사 5건도 레벨 2") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 5)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 2
            }
        }

        context("성사 건수 6~10건") {
            it("레벨 3, 커미션 25% (ADR 0044)") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 6)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 3
                level.commissionRate shouldBeExactly 0.25
            }
        }

        context("성사 건수 11~20건") {
            it("레벨 4, 커미션 30% (ADR 0044)") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 11)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 4
                level.commissionRate shouldBeExactly 0.30
            }
        }

        context("성사 건수 21건 이상") {
            it("레벨 5, 커미션 40% (ADR 0044)") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 21)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 5
                level.commissionRate shouldBeExactly 0.40
            }

            it("매우 많은 건수도 레벨 5") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 999)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 5
            }
        }
    }

    describe("MatchmakerLevel.initial") {
        it("초기 레벨은 1, 커미션 15% (ADR 0044)") {
            val level = MatchmakerLevel.initial()
            level.level shouldBe 1
            level.commissionRate shouldBeExactly 0.15
        }
    }
})
