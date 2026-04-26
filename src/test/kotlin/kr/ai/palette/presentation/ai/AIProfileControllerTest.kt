package kr.ai.palette.presentation.ai

import tools.jackson.module.kotlin.jsonMapper
import tools.jackson.module.kotlin.kotlinModule
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kr.ai.palette.infrastructure.ai.IdealTypeContext
import kr.ai.palette.infrastructure.ai.IntroMethod
import kr.ai.palette.infrastructure.ai.OpenAIService
import kr.ai.palette.infrastructure.ai.ProfileGenerationRequest
import kr.ai.palette.infrastructure.ai.ProfileGenerationResult
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders

class AIProfileControllerTest : DescribeSpec({

    val openAIService = mockk<OpenAIService>()
    val controller = AIProfileController(openAIService)
    val mockMvc: MockMvc = MockMvcBuilders.standaloneSetup(controller).build()
    val objectMapper = jsonMapper { addModule(kotlinModule()) }

    val sampleResult = ProfileGenerationResult(
        colorType = "CALM_BLUE",
        colorName = "차분한 블루",
        colorHex = "#4A90D9",
        colorDescription = "신중하고 깊이있는 당신",
        generatedIntroduction = "IT 개발자로 일하고 있어요. 주말엔 카페에서 책 읽는 걸 좋아해요.",
    )

    describe("POST /api/v1/ai-profile/generate") {

        context("INTERVIEW 방식으로 요청") {
            it("200 응답과 생성된 프로필을 반환한다") {
                every { openAIService.generateProfile(any()) } returns sampleResult

                val request = GenerateRequest(
                    introMethod = "INTERVIEW",
                    interviewAnswers = mapOf("job" to "IT/개발", "weekend" to "카페 독서"),
                    idealType = IdealTypeRequest(personalities = listOf("다정한")),
                )

                mockMvc.perform(
                    post("/api/v1/ai-profile/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                )
                    .andExpect(status().isOk)
                    .andExpect(jsonPath("$.colorType").value("CALM_BLUE"))
                    .andExpect(jsonPath("$.colorName").value("차분한 블루"))
                    .andExpect(jsonPath("$.colorHex").value("#4A90D9"))
                    .andExpect(jsonPath("$.generatedIntroduction").isNotEmpty)
            }

            it("OpenAIService에 INTERVIEW introMethod로 요청한다") {
                every { openAIService.generateProfile(any()) } returns sampleResult

                val request = GenerateRequest(
                    introMethod = "INTERVIEW",
                    interviewAnswers = mapOf("job" to "IT/개발"),
                )

                mockMvc.perform(
                    post("/api/v1/ai-profile/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                )

                verify {
                    openAIService.generateProfile(
                        match { it.introMethod == IntroMethod.INTERVIEW }
                    )
                }
            }
        }

        context("MANUAL 방식으로 요청") {
            it("OpenAIService에 MANUAL introMethod로 요청한다") {
                every { openAIService.generateProfile(any()) } returns sampleResult

                val request = GenerateRequest(
                    introMethod = "MANUAL",
                    manualAnswers = mapOf("hobby" to "테니스", "charm" to "유머 감각"),
                )

                mockMvc.perform(
                    post("/api/v1/ai-profile/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                )

                verify {
                    openAIService.generateProfile(
                        match { it.introMethod == IntroMethod.MANUAL }
                    )
                }
            }
        }

        context("이상형 정보가 포함된 요청") {
            it("idealType이 올바르게 전달된다") {
                every { openAIService.generateProfile(any()) } returns sampleResult

                val request = GenerateRequest(
                    introMethod = "INTERVIEW",
                    idealType = IdealTypeRequest(
                        personalities = listOf("다정한", "유머있는"),
                        datePreferences = listOf("인도어"),
                        importantValues = listOf("신뢰"),
                        dealBreakers = listOf("흡연"),
                    ),
                )

                mockMvc.perform(
                    post("/api/v1/ai-profile/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                )

                verify {
                    openAIService.generateProfile(
                        match {
                            it.idealType?.personalities == listOf("다정한", "유머있는") &&
                                it.idealType?.dealBreakers == listOf("흡연")
                        }
                    )
                }
            }
        }

        context("introMethod 기본값") {
            it("introMethod 미입력시 INTERVIEW로 처리된다") {
                every { openAIService.generateProfile(any()) } returns sampleResult

                val request = GenerateRequest()

                mockMvc.perform(
                    post("/api/v1/ai-profile/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                )

                verify {
                    openAIService.generateProfile(
                        match { it.introMethod == IntroMethod.INTERVIEW }
                    )
                }
            }
        }
    }
})
