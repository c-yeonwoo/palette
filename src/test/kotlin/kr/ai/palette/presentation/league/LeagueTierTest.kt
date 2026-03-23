package kr.ai.palette.presentation.league

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe

class LeagueTierTest : DescribeSpec({

    describe("LeagueTier.fromMatches()") {

        context("성공 건수 0건") {
            it("브론즈 큐피드(BRONZE) 티어") {
                LeagueTier.fromMatches(0) shouldBe LeagueTier.BRONZE
            }
        }

        context("성공 건수 1~2건") {
            it("1건 → 브론즈") {
                LeagueTier.fromMatches(1) shouldBe LeagueTier.BRONZE
            }

            it("2건 → 브론즈") {
                LeagueTier.fromMatches(2) shouldBe LeagueTier.BRONZE
            }
        }

        context("성공 건수 3~5건") {
            it("3건 → 실버 큐피드(SILVER)") {
                LeagueTier.fromMatches(3) shouldBe LeagueTier.SILVER
            }

            it("5건 → 실버") {
                LeagueTier.fromMatches(5) shouldBe LeagueTier.SILVER
            }
        }

        context("성공 건수 6~10건") {
            it("6건 → 골드 큐피드(GOLD)") {
                LeagueTier.fromMatches(6) shouldBe LeagueTier.GOLD
            }

            it("10건 → 골드") {
                LeagueTier.fromMatches(10) shouldBe LeagueTier.GOLD
            }
        }

        context("성공 건수 11~20건") {
            it("11건 → 플래티넘 큐피드(PLATINUM)") {
                LeagueTier.fromMatches(11) shouldBe LeagueTier.PLATINUM
            }

            it("20건 → 플래티넘") {
                LeagueTier.fromMatches(20) shouldBe LeagueTier.PLATINUM
            }
        }

        context("성공 건수 21건 이상") {
            it("21건 → 다이아 큐피드(DIAMOND)") {
                LeagueTier.fromMatches(21) shouldBe LeagueTier.DIAMOND
            }

            it("매우 많은 건수(999건)도 다이아") {
                LeagueTier.fromMatches(999) shouldBe LeagueTier.DIAMOND
            }
        }
    }

    describe("LeagueTier 속성 검증") {

        it("BRONZE의 minMatches는 0이다") {
            LeagueTier.BRONZE.minMatches shouldBe 0
        }

        it("SILVER의 minMatches는 3이다") {
            LeagueTier.SILVER.minMatches shouldBe 3
        }

        it("GOLD의 minMatches는 6이다") {
            LeagueTier.GOLD.minMatches shouldBe 6
        }

        it("PLATINUM의 minMatches는 11이다") {
            LeagueTier.PLATINUM.minMatches shouldBe 11
        }

        it("DIAMOND의 minMatches는 21이다") {
            LeagueTier.DIAMOND.minMatches shouldBe 21
        }

        it("티어 레이블이 올바르게 설정되어 있다") {
            LeagueTier.BRONZE.label shouldBe "브론즈 큐피드"
            LeagueTier.SILVER.label shouldBe "실버 큐피드"
            LeagueTier.GOLD.label shouldBe "골드 큐피드"
            LeagueTier.PLATINUM.label shouldBe "플래티넘 큐피드"
            LeagueTier.DIAMOND.label shouldBe "다이아 큐피드"
        }
    }
})
