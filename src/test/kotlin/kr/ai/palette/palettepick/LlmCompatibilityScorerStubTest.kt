package kr.ai.palette.palettepick

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.jacksonObjectMapper
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldNotBeEmpty
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.mockk.every
import io.mockk.mockk
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.Profile
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.palettepick.application.EmbeddingRefreshService
import kr.ai.palette.palettepick.application.LlmCompatibilityScorer
import kr.ai.palette.palettepick.domain.PalettePickScore
import kr.ai.palette.palettepick.persistence.CompatibilityAnalysisEntity
import kr.ai.palette.palettepick.persistence.CompatibilityAnalysisJpaRepository
import kr.ai.palette.persistence.ai.LlmUsageLogJpaRepository
import org.springframework.web.client.RestClient
import java.util.UUID

/**
 * 안전바 검증 — API 키 없는 stub 모드 / 캐시 hit / JSON 구조.
 * 외부 OpenAI 호출 없음 (stub mode 강제).
 */
class LlmCompatibilityScorerStubTest : DescribeSpec({

    val viewerId = UUID.randomUUID()
    val candidateId = UUID.randomUUID()
    val mapper: ObjectMapper = jacksonObjectMapper()

    fun newScorer(
        analysisRepo: CompatibilityAnalysisJpaRepository,
        embeddingRefresh: EmbeddingRefreshService,
        profileRepo: ProfileRepository,
    ): LlmCompatibilityScorer = LlmCompatibilityScorer(
        apiKey = "dummy",          // → stub 모드 강제, OpenAI 호출 X
        model = "gpt-4o-mini",
        restClientBuilder = RestClient.builder(),
        objectMapper = mapper,
        analysisRepository = analysisRepo,
        usageLogRepository = mockk(relaxed = true),
        embeddingRefreshService = embeddingRefresh,
        profileRepository = profileRepo,
    )

    describe("LlmCompatibilityScorer — stub 모드 & 캐시") {

        it("프로필 없으면 null 반환") {
            val analysisRepo = mockk<CompatibilityAnalysisJpaRepository>(relaxed = true)
            val embedRefresh = mockk<EmbeddingRefreshService>(relaxed = true)
            val profileRepo = mockk<ProfileRepository>()
            every { profileRepo.findByUserId(UserId(viewerId)) } returns null

            val scorer = newScorer(analysisRepo, embedRefresh, profileRepo)
            val result = scorer.scoreOrCache(viewerId, candidateId, PalettePickScore())
            result shouldBe null
        }

        it("stub JSON 은 summary/strengths/firstQuestion 키를 포함") {
            val viewerProfile = mockk<Profile>(relaxed = true)
            val candidateProfile = mockk<Profile>(relaxed = true)
            every { viewerProfile.colorType } returns mockk(relaxed = true) {
                every { name } returns "따뜻한 오렌지"
            }
            every { candidateProfile.colorType } returns mockk(relaxed = true) {
                every { name } returns "차분한 블루"
            }
            val score = PalettePickScore(
                mutualIdealFit = 0.6, introSimilarity = 0.5,
                colorCompatibility = 0.9, momentum = 0.5,
            )

            val analysisRepo = mockk<CompatibilityAnalysisJpaRepository>()
            val embedRefresh = mockk<EmbeddingRefreshService>(relaxed = true)
            val profileRepo = mockk<ProfileRepository>()
            every { profileRepo.findByUserId(UserId(viewerId)) } returns viewerProfile
            every { profileRepo.findByUserId(UserId(candidateId)) } returns candidateProfile
            every { embedRefresh.buildIntroText(any()) } returns "자기소개 텍스트"
            every { embedRefresh.buildIdealText(any()) } returns "이상형 텍스트"
            every { analysisRepo.findByViewerUserIdAndCandidateUserId(viewerId, candidateId) } returns null
            every { analysisRepo.save(any<CompatibilityAnalysisEntity>()) } answers { firstArg() }

            val scorer = newScorer(analysisRepo, embedRefresh, profileRepo)
            val result = scorer.scoreOrCache(viewerId, candidateId, score)

            result shouldNotBe null
            @Suppress("UNCHECKED_CAST")
            val parsed = mapper.readValue(result!!.summaryJson, Map::class.java) as Map<String, Any?>
            (parsed["summary"] as String).shouldContain("따뜻한 오렌지")
            (parsed["strengths"] as List<*>).shouldNotBeEmpty()
            (parsed["firstQuestion"] as String).shouldContain("?")
            result.scoreDeterministic shouldBe score.total
        }

        it("동일 inputsHash 캐시 hit — LLM 호출 없이 점수만 갱신") {
            val viewerProfile = mockk<Profile>(relaxed = true)
            val candidateProfile = mockk<Profile>(relaxed = true)
            every { viewerProfile.colorType } returns mockk(relaxed = true) { every { name } returns "따뜻한 오렌지" }
            every { candidateProfile.colorType } returns mockk(relaxed = true) { every { name } returns "차분한 블루" }

            val analysisRepo = mockk<CompatibilityAnalysisJpaRepository>()
            val embedRefresh = mockk<EmbeddingRefreshService>(relaxed = true)
            val profileRepo = mockk<ProfileRepository>()
            every { profileRepo.findByUserId(UserId(viewerId)) } returns viewerProfile
            every { profileRepo.findByUserId(UserId(candidateId)) } returns candidateProfile
            every { embedRefresh.buildIntroText(any()) } returns "동일"
            every { embedRefresh.buildIdealText(any()) } returns "동일"

            // 미리 같은 hash 로 저장된 entity 가 있다고 가정
            val scorer = newScorer(analysisRepo, embedRefresh, profileRepo)

            // 첫 호출 시 사용할 hash 를 알아내야 하므로, 우선 hash 와 무관한 mock 으로 cache miss → save 한 결과를 캡처
            every { analysisRepo.findByViewerUserIdAndCandidateUserId(viewerId, candidateId) } returns null
            every { analysisRepo.save(any<CompatibilityAnalysisEntity>()) } answers { firstArg() }
            val first = scorer.scoreOrCache(viewerId, candidateId, PalettePickScore(mutualIdealFit = 0.3))
            first shouldNotBe null

            // 같은 텍스트 → 같은 hash 로 다시 조회되면 캐시 hit (점수만 변경)
            every { analysisRepo.findByViewerUserIdAndCandidateUserId(viewerId, candidateId) } returns first
            val second = scorer.scoreOrCache(
                viewerId, candidateId, PalettePickScore(mutualIdealFit = 0.7)  // 점수만 변경
            )
            second!!.summaryJson shouldBe first!!.summaryJson  // JSON 그대로
            second.scoreDeterministic shouldBe PalettePickScore(mutualIdealFit = 0.7).total
        }
    }
})

// kotest의 shouldNotBe 는 import 충돌 회피를 위해 inline 정의
private infix fun <T> T?.shouldNotBe(other: T?) {
    if (this == other) throw AssertionError("Expected not to be $other but was $this")
}
