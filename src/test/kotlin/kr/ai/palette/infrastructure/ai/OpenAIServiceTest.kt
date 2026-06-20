package kr.ai.palette.infrastructure.ai

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldBeEmpty
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
            result.colorHex shouldBe "#3B82F6"
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

        it("introductionSections를 파싱하고 합쳐서 generatedIntroduction을 만든다") {
            val json = """
                {"colorType": "CALM_BLUE",
                 "introductionSections": [
                   {"heading": "제가 보내는 하루", "body": "조용한 카페에서 책 읽는 시간을 좋아해요."},
                   {"heading": "곁에 두고 싶은 가치", "body": "솔직함과 배려를 가장 중요하게 생각해요."}
                 ]}
            """.trimIndent()
            val result = makeService().parseResult(json)

            result.introductionSections.size shouldBe 2
            result.introductionSections[0].heading shouldBe "제가 보내는 하루"
            result.introductionSections[1].body shouldBe "솔직함과 배려를 가장 중요하게 생각해요."
            // 합쳐진 텍스트는 heading + body 를 모두 포함 (영속화 하위호환)
            result.generatedIntroduction shouldContain "제가 보내는 하루"
            result.generatedIntroduction shouldContain "조용한 카페에서 책 읽는 시간을 좋아해요."
        }

        it("body가 비어있는 섹션은 무시한다") {
            val json = """
                {"colorType": "WARM_ORANGE",
                 "introductionSections": [
                   {"heading": "제목만", "body": ""},
                   {"heading": "유효", "body": "내용 있음"}
                 ]}
            """.trimIndent()
            val result = makeService().parseResult(json)
            result.introductionSections.size shouldBe 1
            result.introductionSections[0].body shouldBe "내용 있음"
        }

        it("introductionSections가 없으면 평면 introduction을 fallback으로 쓴다") {
            val json = """{"colorType": "CALM_BLUE", "introduction": "평면 소개글"}"""
            val result = makeService().parseResult(json)
            result.introductionSections.shouldBeEmpty()
            result.generatedIntroduction shouldBe "평면 소개글"
        }
    }

    describe("적응형 인터뷰 (ADR 0068)") {

        describe("buildAdaptivePrompt") {
            it("앞 단계 구조화 정보가 프롬프트에 라벨로 들어간다") {
                val ctx = AdaptiveInterviewContext(
                    mbti = "ENFP",
                    jobCategory = "IT/개발",
                    interests = listOf("여행", "카페"),
                    idealPersonalities = listOf("다정한"),
                    idealImportantValues = listOf("가치관"),
                )
                val prompt = makeService().buildAdaptivePrompt(ctx, 3)

                prompt shouldContain "ENFP"
                prompt shouldContain "IT/개발"
                prompt shouldContain "여행, 카페"
                prompt shouldContain "다정한"
                prompt shouldContain "가치관"
                // 요청 개수가 명시된다
                prompt shouldContain "3개"
                // "다시 묻지 마세요" 가드 문구
                prompt shouldContain "다시 묻지 마세요"
            }

            it("datingStyle 코드는 DATING_STYLE_LABELS 한글로 해석된다") {
                val ctx = AdaptiveInterviewContext(
                    datingStyle = mapOf("CONTACT_STYLE" to "FREQUENT", "AFFECTION_STYLE" to "PHYSICAL"),
                )
                val prompt = makeService().buildAdaptivePrompt(ctx, 3)

                prompt shouldContain "연락 스타일"
                prompt shouldContain "자주 연락해요"
                prompt shouldContain "애정 표현"
                prompt shouldContain "스킨십으로"
                // 원시 코드는 노출되지 않는다
                (prompt.contains("FREQUENT")) shouldBe false
            }
        }

        describe("parseAdaptiveQuestions") {
            it("유효한 JSON에서 질문을 파싱하고 count만큼 자른다") {
                val json = """
                    {"questions": [
                      {"id": "q1", "question": "가장 기억에 남는 여행의 한 장면이 있다면?", "hint": "그때 느낌도 함께"},
                      {"id": "q2", "question": "요즘 가장 마음이 편안해지는 순간은?", "hint": ""},
                      {"id": "q3", "question": "대화에서 가장 중요하게 생각하는 건?", "hint": ""},
                      {"id": "q4", "question": "넘치는 질문", "hint": ""}
                    ]}
                """.trimIndent()
                val questions = makeService().parseAdaptiveQuestions(json, 3)

                questions.size shouldBe 3
                questions[0].id shouldBe "q1"
                questions[0].question shouldContain "여행"
                questions[0].hint shouldBe "그때 느낌도 함께"
            }

            it("question이 비면 그 항목은 버리고, id 누락 시 자동 부여한다") {
                val json = """
                    {"questions": [
                      {"question": "", "hint": "빈 질문"},
                      {"question": "id 없는 질문"}
                    ]}
                """.trimIndent()
                val questions = makeService().parseAdaptiveQuestions(json, 3)

                questions.size shouldBe 1
                questions[0].question shouldBe "id 없는 질문"
                questions[0].id.shouldNotBeEmpty()
            }

            it("형식이 깨지거나 questions가 없으면 빈 리스트") {
                makeService().parseAdaptiveQuestions("not json at all", 3).shouldBeEmpty()
                makeService().parseAdaptiveQuestions("""{"foo": 1}""", 3).shouldBeEmpty()
            }
        }
    }
})

private fun makeService() = OpenAIService(
    apiKey = "test-key",
    model = "gpt-4o-mini",
    restClientBuilder = org.springframework.web.client.RestClient.builder(),
    objectMapper = jsonMapper { addModule(kotlinModule()) },
    usageLogRepository = io.mockk.mockk(relaxed = true),
    cacheRepository = io.mockk.mockk(relaxed = true),
)
