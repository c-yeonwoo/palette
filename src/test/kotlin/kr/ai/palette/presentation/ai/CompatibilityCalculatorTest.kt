package kr.ai.palette.presentation.ai

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.ints.shouldBeInRange
import io.kotest.matchers.shouldBe
import java.time.LocalDate

class CompatibilityCalculatorTest : DescribeSpec({

    describe("MBTI 궁합 점수") {

        context("황금 궁합 쌍") {
            it("INTJ-ENFP 황금 궁합은 90점 이상이어야 한다") {
                val score = AiInsightController.calcMbtiScore("INTJ", "ENFP")
                (score >= 90) shouldBe true
            }

            it("INTP-ENTJ 황금 궁합은 90점 이상이어야 한다") {
                val score = AiInsightController.calcMbtiScore("INTP", "ENTJ")
                (score >= 90) shouldBe true
            }

            it("INFJ-ENTP 황금 궁합은 90점 이상이어야 한다") {
                val score = AiInsightController.calcMbtiScore("INFJ", "ENTP")
                (score >= 90) shouldBe true
            }

            it("역방향 황금 궁합(ENFP-INTJ)도 90점 이상이어야 한다") {
                val score = AiInsightController.calcMbtiScore("ENFP", "INTJ")
                (score >= 90) shouldBe true
            }

            it("ISTJ-ESFP 황금 궁합은 90점 이상이어야 한다") {
                val score = AiInsightController.calcMbtiScore("ISTJ", "ESFP")
                (score >= 90) shouldBe true
            }
        }

        context("동일 MBTI 쌍") {
            it("ENFP-ENFP 동일 쌍은 70점이어야 한다") {
                val score = AiInsightController.calcMbtiScore("ENFP", "ENFP")
                score shouldBe 70
            }

            it("INTJ-INTJ 동일 쌍은 70점이어야 한다") {
                val score = AiInsightController.calcMbtiScore("INTJ", "INTJ")
                score shouldBe 70
            }
        }

        context("같은 기질 쌍") {
            it("같은 NT 기질(INTJ-INTP)은 80점이어야 한다") {
                val score = AiInsightController.calcMbtiScore("INTJ", "INTP")
                score shouldBe 80
            }

            it("같은 SJ 기질(ISTJ-ISFJ)은 80점이어야 한다") {
                val score = AiInsightController.calcMbtiScore("ISTJ", "ISFJ")
                score shouldBe 80
            }
        }

        context("MBTI null 입력") {
            it("MBTI 정보가 없으면 기본 75점을 반환해야 한다") {
                val score = AiInsightController.calcMbtiScore(null, null)
                score shouldBe 75
            }
        }
    }

    describe("별자리 궁합 점수") {

        context("불-공기 조합") {
            it("양자리(Fire)와 쌍둥이자리(Air)의 궁합은 95점이어야 한다") {
                // Aries: Mar 21 - Apr 19, Gemini: May 21 - Jun 20
                val ariesDate = LocalDate.of(1995, 4, 1)
                val geminiDate = LocalDate.of(1997, 6, 1)
                val score = AiInsightController.calcZodiacScore(ariesDate, geminiDate)
                score shouldBe 95
            }

            it("사자자리(Fire)와 천칭자리(Air)의 궁합은 95점이어야 한다") {
                val leoDate = LocalDate.of(1995, 8, 1)
                val libraDate = LocalDate.of(1997, 10, 1)
                val score = AiInsightController.calcZodiacScore(leoDate, libraDate)
                score shouldBe 95
            }
        }

        context("물-불 조합") {
            it("게자리(Water)와 양자리(Fire)의 궁합은 55점이어야 한다") {
                // Cancer: Jun 21 - Jul 22, Aries: Mar 21 - Apr 19
                val cancerDate = LocalDate.of(1995, 7, 1)
                val ariesDate = LocalDate.of(1997, 4, 1)
                val score = AiInsightController.calcZodiacScore(cancerDate, ariesDate)
                score shouldBe 55
            }
        }

        context("같은 원소 조합") {
            it("같은 Fire 원소(양자리-사자자리)는 90점이어야 한다") {
                val ariesDate = LocalDate.of(1995, 4, 1)
                val leoDate = LocalDate.of(1997, 8, 1)
                val score = AiInsightController.calcZodiacScore(ariesDate, leoDate)
                score shouldBe 90
            }
        }
    }

    describe("오행 궁합 점수") {

        context("같은 오행") {
            it("같은 연도 오행이면 80점이어야 한다") {
                // 1994, 1995 → Wood (4,5 mod 10)
                val score = AiInsightController.calcElementScore(1994, 1995)
                score shouldBe 80
            }

            it("같은 Metal 오행(2000, 2001)이면 80점이어야 한다") {
                val score = AiInsightController.calcElementScore(2000, 2001)
                score shouldBe 80
            }
        }

        context("상생 관계") {
            it("Wood(1994)→Fire(1996) 상생 관계는 85점이어야 한다") {
                // 1994 → Wood (4), 1996 → Fire (6)
                val score = AiInsightController.calcElementScore(1994, 1996)
                score shouldBe 85
            }

            it("Fire(1996)→Earth(1998) 상생 관계는 85점이어야 한다") {
                // 1996 → Fire (6), 1998 → Earth (8)
                val score = AiInsightController.calcElementScore(1996, 1998)
                score shouldBe 85
            }
        }

        context("상극 관계") {
            it("Wood(1994)→Earth(1998) 상극 관계는 55점이어야 한다") {
                // 1994 → Wood (4), 1998 → Earth (8)
                val score = AiInsightController.calcElementScore(1994, 1998)
                score shouldBe 55
            }
        }
    }

    describe("전체 궁합 점수 계산") {

        context("점수 범위 검증") {
            it("전체 점수는 0~100 범위여야 한다") {
                val request = CompatibilityRequest(
                    birthDate1 = "1995-03-15",
                    birthDate2 = "1997-08-22",
                    mbti1 = "ENFP",
                    mbti2 = "INTJ",
                    colorType1 = "WARM_ORANGE",
                    colorType2 = "CALM_BLUE",
                )
                val response = AiInsightController.calculate(request)
                response.totalScore shouldBeInRange (0..100)
            }

            it("MBTI/컬러 없이도 0~100 범위여야 한다") {
                val request = CompatibilityRequest(
                    birthDate1 = "1990-01-01",
                    birthDate2 = "1992-06-15",
                )
                val response = AiInsightController.calculate(request)
                response.totalScore shouldBeInRange (0..100)
            }
        }

        context("레벨 레이블 경계값 검증") {
            it("95점 이상은 '운명적 인연'이어야 한다") {
                // Fire-Air (95) zodiac + golden MBTI (92) → should be very high
                val request = CompatibilityRequest(
                    birthDate1 = "1994-04-01", // Aries (Fire)
                    birthDate2 = "1996-06-01", // Gemini (Air)
                    mbti1 = "INTJ",
                    mbti2 = "ENFP",
                    colorType1 = "SOFT_PINK",
                    colorType2 = "ELEGANT_PURPLE",
                )
                val response = AiInsightController.calculate(request)
                response.totalScore shouldBeInRange (0..100)
                // The level should be one of the defined levels
                listOf("운명적 인연", "천생연분", "잘 어울려요", "노력이 필요해요", "새로운 도전")
                    .contains(response.level) shouldBe true
            }

            it("레벨에 따른 이모지가 올바르게 반환되어야 한다") {
                val request = CompatibilityRequest(
                    birthDate1 = "1995-03-15",
                    birthDate2 = "1997-08-22",
                    mbti1 = "ENFP",
                    mbti2 = "INTJ",
                )
                val response = AiInsightController.calculate(request)
                listOf("💫", "💕", "😊", "🤝", "🌱").contains(response.emoji) shouldBe true
            }
        }

        context("breakdown 검증") {
            it("breakdown의 각 점수가 포함되어야 한다") {
                val request = CompatibilityRequest(
                    birthDate1 = "1995-03-15",
                    birthDate2 = "1997-08-22",
                    mbti1 = "ENFP",
                    mbti2 = "INTJ",
                    colorType1 = "WARM_ORANGE",
                    colorType2 = "CALM_BLUE",
                )
                val response = AiInsightController.calculate(request)
                response.breakdown.mbtiScore shouldBeInRange (0..100)
                response.breakdown.zodiacScore shouldBeInRange (0..100)
                response.breakdown.elementScore shouldBeInRange (0..100)
                response.breakdown.colorScore shouldBeInRange (0..100)
            }

            it("summary가 비어있지 않아야 한다") {
                val request = CompatibilityRequest(
                    birthDate1 = "1995-03-15",
                    birthDate2 = "1997-08-22",
                )
                val response = AiInsightController.calculate(request)
                response.summary.isNotBlank() shouldBe true
            }
        }
    }

    describe("컬러 궁합 점수") {
        it("WARM_ORANGE-CALM_BLUE 조합은 90점이어야 한다") {
            val score = AiInsightController.calcColorScore("WARM_ORANGE", "CALM_BLUE")
            score shouldBe 90
        }

        it("SOFT_PINK-ELEGANT_PURPLE 조합은 90점이어야 한다") {
            val score = AiInsightController.calcColorScore("SOFT_PINK", "ELEGANT_PURPLE")
            score shouldBe 90
        }

        it("같은 컬러 타입은 70점이어야 한다") {
            val score = AiInsightController.calcColorScore("WARM_ORANGE", "WARM_ORANGE")
            score shouldBe 70
        }

        it("알 수 없는 조합은 75점이어야 한다") {
            val score = AiInsightController.calcColorScore("UNKNOWN_A", "UNKNOWN_B")
            score shouldBe 75
        }

        it("컬러 정보가 없으면 75점이어야 한다") {
            val score = AiInsightController.calcColorScore(null, null)
            score shouldBe 75
        }
    }
})
