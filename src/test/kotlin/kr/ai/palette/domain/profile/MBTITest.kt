package kr.ai.palette.domain.profile

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.collections.shouldContainExactly

class MBTITest : DescribeSpec({
    describe("MBTI enum") {
        context("모든 16개 타입이 정의되어 있을 때") {
            it("16개의 MBTI 타입을 가지고 있어야 한다") {
                MBTI.entries.size shouldBe 16
            }

            it("모든 MBTI 타입이 올바르게 정의되어 있어야 한다") {
                val expectedTypes = listOf(
                    MBTI.ISTJ, MBTI.ISFJ, MBTI.INFJ, MBTI.INTJ,
                    MBTI.ISTP, MBTI.ISFP, MBTI.INFP, MBTI.INTP,
                    MBTI.ESTP, MBTI.ESFP, MBTI.ENFP, MBTI.ENTP,
                    MBTI.ESTJ, MBTI.ESFJ, MBTI.ENFJ, MBTI.ENTJ
                )
                MBTI.entries shouldContainExactly expectedTypes
            }
        }

        context("MBTI 타입 이름으로 변환할 때") {
            it("valueOf로 올바른 MBTI를 가져올 수 있어야 한다") {
                MBTI.valueOf("ENFP") shouldBe MBTI.ENFP
                MBTI.valueOf("INTJ") shouldBe MBTI.INTJ
                MBTI.valueOf("ISFJ") shouldBe MBTI.ISFJ
            }
        }

        context("MBTI 타입의 이름을 확인할 때") {
            it("올바른 문자열 이름을 반환해야 한다") {
                MBTI.ENFP.name shouldBe "ENFP"
                MBTI.INTJ.name shouldBe "INTJ"
                MBTI.ISFJ.name shouldBe "ISFJ"
            }
        }
    }
})
