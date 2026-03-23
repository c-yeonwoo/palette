package kr.ai.palette.presentation.friendship

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldHaveLength

/**
 * FriendshipController.generateCode()의 로직을 단위 테스트합니다.
 * private companion object 메서드이므로, 동일한 로직을 재현하여 테스트합니다.
 */
class InviteCodeTest : DescribeSpec({

    // FriendshipController.Companion.generateCode() 내부 로직과 동일
    val validChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

    fun generateCode(): String {
        return (1..6).map { validChars.random() }.joinToString("")
    }

    describe("FriendshipController.generateCode() 로직 검증") {

        context("코드 형식 검증") {
            it("생성된 코드는 6자리여야 한다") {
                val code = generateCode()
                code shouldHaveLength 6
            }

            it("생성된 코드는 유효한 문자(대문자+숫자, O/0/1/I 제외)만 포함한다") {
                repeat(20) {
                    val code = generateCode()
                    code.all { it in validChars } shouldBe true
                }
            }

            it("혼동하기 쉬운 문자(O, 0, I, 1)는 포함되지 않는다") {
                repeat(50) {
                    val code = generateCode()
                    code.contains('O') shouldBe false
                    code.contains('0') shouldBe false
                    code.contains('I') shouldBe false
                    code.contains('1') shouldBe false
                }
            }
        }

        context("유효 문자 집합 검증") {
            it("알파벳 소문자는 포함되지 않는다") {
                repeat(30) {
                    val code = generateCode()
                    code.none { it.isLowerCase() } shouldBe true
                }
            }

            it("특수문자는 포함되지 않는다") {
                repeat(30) {
                    val code = generateCode()
                    code.all { it.isLetterOrDigit() } shouldBe true
                }
            }
        }

        context("무작위성 검증") {
            it("20번 생성 시 최소 10개 이상 유니크한 코드가 나온다") {
                val codes = (1..20).map { generateCode() }.toSet()
                (codes.size >= 10) shouldBe true
            }
        }

        context("유효 문자 집합 구성") {
            it("validChars에 32개 문자가 포함된다") {
                validChars.length shouldBe 32
            }

            it("validChars는 중복 없이 구성된다") {
                validChars.toSet().size shouldBe validChars.length
            }

            it("대문자 A가 포함된다") {
                validChars.contains('A') shouldBe true
            }

            it("대문자 Z가 포함된다") {
                validChars.contains('Z') shouldBe true
            }
        }
    }
})
