package kr.ai.palette.presentation.fortune

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.ints.shouldBeInRange
import io.kotest.matchers.string.shouldNotBeEmpty
import kr.ai.palette.presentation.fortune.FortuneController.Companion.generateFortune
import java.time.LocalDate

class FortuneControllerTest : DescribeSpec({

    describe("Fortune 생성") {

        context("기본 속성 검증") {
            it("date는 오늘 날짜여야 한다") {
                val fortune = generateFortune(seed = 12345L, gender = "MALE")
                fortune.date shouldBe LocalDate.now().toString()
            }

            it("loveScore는 1~5 범위여야 한다") {
                val fortune = generateFortune(seed = 99999L, gender = "FEMALE")
                fortune.loveScore shouldBeInRange (1..5)
            }

            it("luckyNumber는 1~99 범위여야 한다") {
                val fortune = generateFortune(seed = 42L, gender = "MALE")
                fortune.luckyNumber shouldBeInRange (1..99)
            }

            it("title이 비어있지 않아야 한다") {
                val fortune = generateFortune(seed = 1L, gender = "MALE")
                fortune.title.shouldNotBeEmpty()
            }

            it("message가 비어있지 않아야 한다") {
                val fortune = generateFortune(seed = 1L, gender = "MALE")
                fortune.message.shouldNotBeEmpty()
            }

            it("luckyColor가 비어있지 않아야 한다") {
                val fortune = generateFortune(seed = 1L, gender = "MALE")
                fortune.luckyColor.shouldNotBeEmpty()
            }

            it("luckyColorHex는 # 으로 시작해야 한다") {
                val fortune = generateFortune(seed = 1L, gender = "MALE")
                fortune.luckyColorHex.startsWith("#") shouldBe true
            }
        }

        context("결정론적 생성 (같은 시드 = 같은 결과)") {
            it("같은 시드로 두 번 생성하면 동일한 결과가 나온다") {
                val fortune1 = generateFortune(seed = 777L, gender = "FEMALE")
                val fortune2 = generateFortune(seed = 777L, gender = "FEMALE")

                fortune1.title shouldBe fortune2.title
                fortune1.loveScore shouldBe fortune2.loveScore
                fortune1.luckyNumber shouldBe fortune2.luckyNumber
                fortune1.luckyColor shouldBe fortune2.luckyColor
            }

            it("다른 시드로 생성하면 다른 결과가 나올 수 있다") {
                // 시드 차이가 크면 거의 항상 다른 결과
                val fortune1 = generateFortune(seed = 1L, gender = "MALE")
                val fortune2 = generateFortune(seed = 100000L, gender = "MALE")

                // 모든 필드가 같을 확률은 매우 낮음
                val allSame = fortune1.title == fortune2.title &&
                    fortune1.loveScore == fortune2.loveScore &&
                    fortune1.luckyNumber == fortune2.luckyNumber
                allSame shouldBe false
            }
        }

        context("성별 맞춤 궁합 힌트") {
            it("MALE 성별에 맞는 힌트가 생성된다") {
                val fortune = generateFortune(seed = 123L, gender = "MALE")
                fortune.compatibilityHint.shouldNotBeEmpty()
            }

            it("FEMALE 성별에 맞는 힌트가 생성된다") {
                val fortune = generateFortune(seed = 123L, gender = "FEMALE")
                fortune.compatibilityHint.shouldNotBeEmpty()
            }
        }
    }
})
