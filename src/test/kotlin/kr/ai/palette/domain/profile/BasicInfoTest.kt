package kr.ai.palette.domain.profile

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull

class BasicInfoTest : DescribeSpec({
    describe("BasicInfo") {
        context("모든 필드가 채워진 BasicInfo를 생성할 때") {
            it("모든 필드가 올바르게 설정되어야 한다") {
                val basicInfo = BasicInfo(
                    height = 175,
                    bodyType = BodyType.ATHLETIC.name,
                    mbti = MBTI.ENFP
                )

                basicInfo.height shouldBe 175
                basicInfo.bodyType shouldBe BodyType.ATHLETIC.name
                basicInfo.mbti shouldBe MBTI.ENFP
            }
        }

        context("선택적 필드가 null인 BasicInfo를 생성할 때") {
            it("height와 bodyType은 null일 수 있지만 mbti는 필수여야 한다") {
                val basicInfo = BasicInfo(
                    height = null,
                    bodyType = null,
                    mbti = MBTI.INTJ
                )

                basicInfo.height.shouldBeNull()
                basicInfo.bodyType.shouldBeNull()
                basicInfo.mbti shouldBe MBTI.INTJ
            }
        }

        context("다양한 MBTI 타입으로 BasicInfo를 생성할 때") {
            it("16가지 모든 MBTI 타입을 지원해야 한다") {
                MBTI.entries.forEach { mbtiType ->
                    val basicInfo = BasicInfo(
                        height = 170,
                        bodyType = BodyType.AVERAGE.name,
                        mbti = mbtiType
                    )
                    basicInfo.mbti shouldBe mbtiType
                }
            }
        }

        context("다양한 체형 타입으로 BasicInfo를 생성할 때") {
            it("5가지 모든 체형 타입을 지원해야 한다") {
                BodyType.entries.forEach { bodyType ->
                    val basicInfo = BasicInfo(
                        height = 170,
                        bodyType = bodyType.name,   // ADR 0057 — String 코드
                        mbti = MBTI.ENFP
                    )
                    basicInfo.bodyType shouldBe bodyType.name
                }
            }
        }

        context("BasicInfo를 복사할 때") {
            it("특정 필드만 변경할 수 있어야 한다") {
                val original = BasicInfo(
                    height = 170,
                    bodyType = BodyType.SLIM.name,
                    mbti = MBTI.ENFP
                )

                val copied = original.copy(mbti = MBTI.INTJ)

                copied.height shouldBe 170
                copied.bodyType shouldBe BodyType.SLIM.name
                copied.mbti shouldBe MBTI.INTJ
            }
        }
    }
})
