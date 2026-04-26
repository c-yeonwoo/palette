package kr.ai.palette.infrastructure.ai

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.kotest.matchers.string.shouldNotBeEmpty
import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.jsonMapper
import tools.jackson.module.kotlin.kotlinModule

class OpenAIServiceTest : DescribeSpec({

    describe("buildUserPrompt") {

        context("INTERVIEW 방식") {
            it("인터뷰 답변이 프롬프트에 포함된다") {
                val request = ProfileGenerationRequest(
                    introMethod = IntroMethod.INTERVIEW,
                    interviewAnswers = mapOf(
                        "job" to "IT/개발",
                        "weekend" to "카페에서 독서",
                        "personality" to "차분한, 신중한",
                    ),
                )
                val service = makeService()
                val prompt = service.buildUserPrompt(request)

                prompt shouldContain "AI 인터뷰 답변"
                prompt shouldContain "IT/개발"
                prompt shouldContain "카페에서 독서"
                prompt shouldContain "차분한, 신중한"
            }

            it("INTERVIEW_LABELS로 한글 레이블이 표시된다") {
                val request = ProfileGenerationRequest(
                    introMethod = IntroMethod.INTERVIEW,
                    interviewAnswers = mapOf("job" to "IT/개발"),
                )
                val prompt = makeService().buildUserPrompt(request)
                prompt shouldContain "직업"
            }
        }

        context("MANUAL 방식") {
            it("직접 작성한 내용이 프롬프트에 포함된다") {
                val request = ProfileGenerationRequest(
                    introMethod = IntroMethod.MANUAL,
                    manualAnswers = mapOf(
                        "hobby" to "주말에 테니스를 쳐요",
                        "charm" to "유머 감각이 있다는 말을 자주 들어요",
                    ),
                )
                val prompt = makeService().buildUserPrompt(request)

                prompt shouldContain "직접 작성한 자기소개"
                prompt shouldContain "주말에 테니스를 쳐요"
                prompt shouldContain "유머 감각이 있다는 말을 자주 들어요"
            }

            it("MANUAL_LABELS로 한글 레이블이 표시된다") {
                val request = ProfileGenerationRequest(
                    introMethod = IntroMethod.MANUAL,
                    manualAnswers = mapOf("hobby" to "테니스"),
                )
                val prompt = makeService().buildUserPrompt(request)
                prompt shouldContain "쉬는 날 하는 것"
            }
        }

        context("이상형 정보") {
            it("이상형 정보가 있으면 프롬프트에 포함된다") {
                val request = ProfileGenerationRequest(
                    introMethod = IntroMethod.INTERVIEW,
                    idealType = IdealTypeContext(
                        personalities = listOf("다정한", "유머있는"),
                        datePreferences = listOf("인도어"),
                        dealBreakers = listOf("흡연"),
                    ),
                )
                val prompt = makeService().buildUserPrompt(request)

                prompt shouldContain "이상형 정보"
                prompt shouldContain "다정한"
                prompt shouldContain "인도어"
                prompt shouldContain "흡연"
            }

            it("이상형 정보가 없으면 이상형 섹션이 없다") {
                val request = ProfileGenerationRequest(introMethod = IntroMethod.INTERVIEW)
                val prompt = makeService().buildUserPrompt(request)
                (prompt.contains("이상형 정보")) shouldBe false
            }
        }
    }

    describe("parseResult") {

        it("유효한 JSON에서 결과를 파싱한다") {
            val json = """{"colorType": "CALM_BLUE", "introduction": "차분하고 깊이 있는 사람이에요."}"""
            val result = makeService().parseResult(json)

            result.colorType shouldBe "CALM_BLUE"
            result.colorName shouldBe "차분한 블루"
            result.colorHex shouldBe "#4A90D9"
            result.generatedIntroduction shouldBe "차분하고 깊이 있는 사람이에요."
        }

        it("알 수 없는 colorType이면 SOPHISTICATED_GRAY로 fallback된다") {
            val json = """{"colorType": "UNKNOWN_COLOR", "introduction": "소개글"}"""
            val result = makeService().parseResult(json)
            result.colorType shouldBe "UNKNOWN_COLOR"
            result.colorDescription.shouldNotBeEmpty()
        }

        it("모든 8가지 colorType을 올바르게 매핑한다") {
            val colorTypes = listOf(
                "WARM_ORANGE", "CALM_BLUE", "VIBRANT_RED", "SOFT_PINK",
                "FRESH_GREEN", "ELEGANT_PURPLE", "BRIGHT_YELLOW", "SOPHISTICATED_GRAY",
            )
            colorTypes.forEach { colorType ->
                val json = """{"colorType": "$colorType", "introduction": "소개"}"""
                val result = makeService().parseResult(json)
                result.colorName.shouldNotBeEmpty()
                result.colorHex shouldContain "#"
            }
        }

        it("colorDescription이 비어있지 않다") {
            val json = """{"colorType": "WARM_ORANGE", "introduction": "소개글"}"""
            val result = makeService().parseResult(json)
            result.colorDescription.shouldNotBeEmpty()
        }
    }
})

private fun makeService() = OpenAIService(
    apiKey = "test-key",
    model = "gpt-4o-mini",
    restClientBuilder = org.springframework.web.client.RestClient.builder(),
    objectMapper = jsonMapper { addModule(kotlinModule()) },
)
