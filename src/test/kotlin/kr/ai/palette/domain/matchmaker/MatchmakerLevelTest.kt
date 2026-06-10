package kr.ai.palette.domain.matchmaker

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.doubles.shouldBeExactly

/**
 * ADR 0044 (가격 v2) + ADR 0038 강화 스케줄 — 커미션 30~50% → 15~40% 재조정 + 0/15/40/70/150 스케줄.
 *   Lv.1 (0~14건):   15%
 *   Lv.2 (15~39건):  20%
 *   Lv.3 (40~69건):  25%
 *   Lv.4 (70~149건): 30%
 *   Lv.5 (150건+):   40%
 *
 * 소개 요청(100 물감) × 등급별 분배율 = 매칭당 보상 (15·20·25·30·40 물감).
 */
class MatchmakerLevelTest : DescribeSpec({

    describe("MatchmakerLevel.calculateLevel") {

        context("성사 건수 0~14건") {
            it("레벨 1, 커미션 15% (ADR 0044)") {
                val stats = MatchmakerStats.initial()
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 1
                level.commissionRate shouldBeExactly 0.15
            }

            it("성사 14건도 레벨 1") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 14)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 1
            }
        }

        context("성사 건수 15~39건") {
            it("레벨 2, 커미션 20% (ADR 0044)") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 15)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 2
                level.commissionRate shouldBeExactly 0.20
            }

            it("성사 39건도 레벨 2") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 39)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 2
            }
        }

        context("성사 건수 40~69건") {
            it("레벨 3, 커미션 25% (ADR 0044)") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 40)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 3
                level.commissionRate shouldBeExactly 0.25
            }
        }

        context("성사 건수 70~149건") {
            it("레벨 4, 커미션 30% (ADR 0044)") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 70)
                val level = MatchmakerLevel.calculateLevel(stats)
                level.level shouldBe 4
                level.commissionRate shouldBeExactly 0.30
            }
        }

        context("성사 건수 150건 이상") {
            it("레벨 5, 커미션 40% (ADR 0044)") {
                val stats = MatchmakerStats.initial().copy(successfulMatches = 150)
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
