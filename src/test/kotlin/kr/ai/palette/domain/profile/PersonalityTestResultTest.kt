package kr.ai.palette.domain.profile

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldNotBeEmpty

class PersonalityTestResultTest : DescribeSpec({
    describe("PersonalityTestResult") {
        context("PersonalityTestResult를 생성할 때") {
            it("link와 title이 올바르게 설정되어야 한다") {
                val test = PersonalityTestResult(
                    link = "https://mbti.cidermics.com/result?userNo=test123",
                    title = "절제가 쉽지 않지만 노력중인 멋쟁이"
                )

                test.link shouldBe "https://mbti.cidermics.com/result?userNo=test123"
                test.title shouldBe "절제가 쉽지 않지만 노력중인 멋쟁이"
            }

            it("link는 비어있지 않아야 한다") {
                val test = PersonalityTestResult(
                    link = "https://example.com/test",
                    title = "테스트 타이틀"
                )

                test.link.shouldNotBeEmpty()
            }

            it("title은 비어있지 않아야 한다") {
                val test = PersonalityTestResult(
                    link = "https://example.com/test",
                    title = "테스트 타이틀"
                )

                test.title.shouldNotBeEmpty()
            }
        }

        context("다양한 외부 테스트 결과를 저장할 때") {
            it("MBTI 테스트 결과를 저장할 수 있어야 한다") {
                val mbtiTest = PersonalityTestResult(
                    link = "https://mbti.com/result/ENFP",
                    title = "ENFP - 재기발랄한 활동가"
                )

                mbtiTest.title shouldBe "ENFP - 재기발랄한 활동가"
            }

            it("에니어그램 테스트 결과를 저장할 수 있어야 한다") {
                val enneagramTest = PersonalityTestResult(
                    link = "https://enneagram.com/result/type7",
                    title = "7번 유형 - 열정적인 사람"
                )

                enneagramTest.title shouldBe "7번 유형 - 열정적인 사람"
            }

            it("기타 성격 테스트 결과를 저장할 수 있어야 한다") {
                val customTest = PersonalityTestResult(
                    link = "https://example.com/test/result",
                    title = "창의적이고 열정적인 리더형"
                )

                customTest.title shouldBe "창의적이고 열정적인 리더형"
            }
        }

        context("PersonalityTestResult를 복사할 때") {
            it("특정 필드만 변경할 수 있어야 한다") {
                val original = PersonalityTestResult(
                    link = "https://example.com/test1",
                    title = "원본 타이틀"
                )

                val copied = original.copy(title = "변경된 타이틀")

                copied.link shouldBe "https://example.com/test1"
                copied.title shouldBe "변경된 타이틀"
            }
        }

        context("PersonalityTestResult의 동등성을 비교할 때") {
            it("같은 link와 title을 가진 객체는 동등해야 한다") {
                val test1 = PersonalityTestResult(
                    link = "https://example.com/test",
                    title = "테스트 타이틀"
                )
                val test2 = PersonalityTestResult(
                    link = "https://example.com/test",
                    title = "테스트 타이틀"
                )

                test1 shouldBe test2
            }
        }
    }
})
