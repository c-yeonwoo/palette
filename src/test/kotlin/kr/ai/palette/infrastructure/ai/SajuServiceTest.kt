package kr.ai.palette.infrastructure.ai

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.shouldBe
import java.time.LocalDate

class SajuServiceTest : DescribeSpec({
    val saju = SajuService()

    describe("연주(年柱) — (year-4) 간지 공식") {
        it("1984 = 갑자년 (띠: 쥐)") {
            val r = saju.analyze(LocalDate.of(1984, 3, 1))
            r.yearStem shouldBe "갑"
            r.yearBranch shouldBe "자"
            r.animal shouldBe "쥐"
        }
        it("2000(입춘 이후) = 경진년 (띠: 용)") {
            val r = saju.analyze(LocalDate.of(2000, 6, 15))
            r.yearStem shouldBe "경"
            r.yearBranch shouldBe "진"
            r.animal shouldBe "용"
        }
        it("입춘(2/4) 이전 출생은 전년으로 보정 — 2000-01-15 → 1999 기묘년(토끼)") {
            val r = saju.analyze(LocalDate.of(2000, 1, 15))
            r.yearStem shouldBe "기"
            r.yearBranch shouldBe "묘"
            r.animal shouldBe "토끼"
        }
    }

    describe("오행 집계 / 결정성") {
        it("오행 분포 합은 5 (연 간·지 + 일 간·지 + 월지)") {
            val r = saju.analyze(LocalDate.of(1993, 7, 20))
            r.elementCounts.values.sum() shouldBe 5
        }
        it("일간 오행은 5행 중 하나") {
            val r = saju.analyze(LocalDate.of(1993, 7, 20))
            listOf("목", "화", "토", "금", "수") shouldContain r.dayMasterElement
        }
        it("같은 생년월일은 항상 같은 결과 (결정적)") {
            val d = LocalDate.of(1990, 11, 3)
            saju.analyze(d) shouldBe saju.analyze(d)
        }
        it("summary 에 띠와 오행 분포가 포함된다") {
            val r = saju.analyze(LocalDate.of(1995, 5, 5))
            r.summary.contains("띠:") shouldBe true
            r.summary.contains("오행 분포") shouldBe true
        }
    }
})
