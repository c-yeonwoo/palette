package kr.ai.palette.presentation.ai

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue
import kr.ai.palette.application.billing.BillingService
import kr.ai.palette.application.billing.InsufficientBalanceException
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.ai.ColorReportContext
import kr.ai.palette.infrastructure.ai.ColorReportResult
import kr.ai.palette.infrastructure.ai.IdealTypeContext
import kr.ai.palette.infrastructure.ai.OpenAIService
import kr.ai.palette.infrastructure.ai.SajuService
import kr.ai.palette.persistence.ai.ColorReportCacheEntity
import kr.ai.palette.persistence.ai.ColorReportCacheJpaRepository
import kr.ai.palette.persistence.option.FieldOptionJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.MessageDigest
import java.time.Instant

/**
 * 프리미엄 "팔레트 분석 리포트" (ADR 0070) + 잠금 해제 (ADR 0069).
 *
 * 무료: 색·키워드·이 색을 고른 근거(프로필 colorType 으로 내려감).
 * 유료(물감 1회 or 광고): 색·결·매력 육각형·장단점·어울리는 인연·연애스타일·연애운(사주)·조언을 한 번에 푸는 풀 리포트.
 *   해제하면 영구 공개. 리포트 본문은 [GET /full] 로 — 잠금 상태에서는 403(프론트 티저만 노출).
 */
@RestController
@RequestMapping("/api/v1/color-report")
class ColorReportController(
    private val billingService: BillingService,
    private val profileRepository: ProfileRepository,
    private val userRepository: UserRepository,
    private val sajuService: SajuService,
    private val fieldOptionRepository: FieldOptionJpaRepository,
    private val openAIService: OpenAIService,
    private val reportCacheRepository: ColorReportCacheJpaRepository,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(ColorReportController::class.java)

    @GetMapping
    fun status(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<Map<String, Any>> {
        val userId = authUser.userId.value.toString()
        return ResponseEntity.ok(
            mapOf(
                "unlocked" to billingService.isReportUnlocked(userId),
                "cost" to REPORT_UNLOCK_COST,
            )
        )
    }

    @PostMapping("/unlock")
    fun unlock(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<Map<String, Any>> {
        val userId = authUser.userId.value.toString()
        return try {
            val balance = billingService.unlockColorReport(userId, REPORT_UNLOCK_COST)
            log.info("팔레트 리포트 잠금 해제 user={} cost={}P", userId, REPORT_UNLOCK_COST)
            ResponseEntity.ok(
                mapOf(
                    "unlocked" to true,
                    "balance" to billingService.totalPoints(balance),
                )
            )
        } catch (e: InsufficientBalanceException) {
            ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(
                mapOf(
                    "unlocked" to false,
                    "required" to e.required,
                    "current" to e.current,
                    "message" to "물감이 부족해요. 충전 후 다시 시도해주세요.",
                )
            )
        }
    }

    /**
     * 풀 리포트 본문. 잠금 해제된 사용자만(미해제 시 403). 색이 아직 없으면 available=false.
     * 같은 프로필이면 캐시본 반환(LLM 비용 0), 프로필이 바뀌면 input_hash 가 달라져 자동 재생성.
     */
    @GetMapping("/full")
    fun full(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<FullReportResponse> {
        val userId = authUser.userId.value.toString()
        if (!billingService.isReportUnlocked(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(FullReportResponse(unlocked = false, available = false, report = null))
        }

        val profile = profileRepository.findByUserId(authUser.userId)
        val color = profile?.colorType
        if (profile == null || color?.name.isNullOrBlank()) {
            return ResponseEntity.ok(FullReportResponse(unlocked = true, available = false, report = null))
        }

        val context = buildContext(profile, color, authUser)
        val inputHash = sha256(objectMapper.writeValueAsString(context))

        val cached = reportCacheRepository.findById(userId).orElse(null)
        if (cached != null && cached.inputHash == inputHash) {
            val report = runCatching { objectMapper.readValue<ColorReportResult>(cached.reportJson) }.getOrNull()
            if (report != null) return ResponseEntity.ok(FullReportResponse(unlocked = true, available = true, report = report))
        }

        val report = openAIService.generateColorReport(context, userId)
        val json = objectMapper.writeValueAsString(report)
        val now = Instant.now()
        if (cached != null) {
            cached.inputHash = inputHash
            cached.reportJson = json
            cached.model = REPORT_MODEL_TAG
            cached.updatedAt = now
            reportCacheRepository.save(cached)
        } else {
            reportCacheRepository.save(
                ColorReportCacheEntity(userId = userId, inputHash = inputHash, reportJson = json, model = REPORT_MODEL_TAG, createdAt = now, updatedAt = now)
            )
        }
        return ResponseEntity.ok(FullReportResponse(unlocked = true, available = true, report = report))
    }

    private fun buildContext(
        profile: kr.ai.palette.domain.profile.Profile,
        color: kr.ai.palette.domain.profile.ColorType,
        authUser: AuthUser,
    ): ColorReportContext {
        val labelMap = optionLabelMap()
        val answers = profile.introduction.interviewAnswers?.let { a ->
            buildMap {
                a.hobby?.takeIf { it.isNotBlank() }?.let { put("쉬는 날 보내는 법", it) }
                a.charm?.takeIf { it.isNotBlank() }?.let { put("나의 매력 포인트", it) }
                a.passion?.takeIf { it.isNotBlank() }?.let { put("요즘 빠져있는 것", it) }
                a.happiness?.takeIf { it.isNotBlank() }?.let { put("행복한 순간", it) }
                a.motto?.takeIf { it.isNotBlank() }?.let { put("인생 좌우명", it) }
            }
        } ?: emptyMap()

        val ideal = profile.idealType
        val idealContext = IdealTypeContext(
            personalities = resolveLabels(labelMap, "personality", ideal.personalities),
            datePreferences = resolveLabels(labelMap, "datePreference", ideal.datePreferences),
            importantValues = resolveLabels(labelMap, "importantValue", ideal.importantValues),
            dealBreakers = resolveLabels(labelMap, "dealBreaker", ideal.dealBreakers),
        )

        val birthDate = userRepository.findById(authUser.userId)?.publicInfo?.birthDate
        val sajuSummary = birthDate?.let { runCatching { sajuService.analyze(it).summary }.getOrNull() }

        return ColorReportContext(
            colorName = color.name,
            colorType = color.type?.name,
            colorDescription = color.description,
            personalitySummary = color.personalitySummary,
            answers = answers,
            idealType = idealContext,
            mbti = profile.basicInfo.mbti?.name,
            sajuSummary = sajuSummary,
        )
    }

    private fun optionLabelMap(): Map<Pair<String, String>, String> =
        fieldOptionRepository.findByActiveTrueOrderBySetKeyAscDisplayOrderAsc()
            .associate { (it.setKey to it.code) to it.label }

    private fun resolveLabels(map: Map<Pair<String, String>, String>, setKey: String, codes: List<String>): List<String> =
        codes.mapNotNull { code -> map[setKey to code] ?: code.takeIf { it.isNotBlank() } }

    private fun sha256(text: String): String =
        MessageDigest.getInstance("SHA-256").digest(text.toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }

    companion object {
        /** 내 리포트 해제 비용 (물감). 남의 프로필 열람(10)보다 저렴 — 자기 분석이므로. */
        const val REPORT_UNLOCK_COST = 5
        private const val REPORT_MODEL_TAG = "color_report"
    }
}

data class FullReportResponse(
    val unlocked: Boolean,
    val available: Boolean,
    val report: ColorReportResult?,
)
