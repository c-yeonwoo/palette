package kr.ai.palette.presentation.ai

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.persistence.ai.UserAiInsightEntity
import kr.ai.palette.persistence.ai.UserAiInsightJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeFormatter

// ─── Request / Response DTOs ─────────────────────────────────────────────────

data class MyInsightsResponse(
    val attachmentStyle: String?,
    val loveLanguage: String?,
)

data class SaveInsightRequest(
    val result: String,
)

data class SaveInsightResponse(
    val attachmentStyle: String?,
    val loveLanguage: String?,
)

data class CompatibilityRequest(
    val birthDate1: String,
    val birthDate2: String,
    val mbti1: String? = null,
    val mbti2: String? = null,
    val colorType1: String? = null,
    val colorType2: String? = null,
)

data class CompatibilityBreakdown(
    val mbtiScore: Int,
    val mbtiLabel: String,
    val zodiacScore: Int,
    val zodiacLabel: String,
    val elementScore: Int,
    val elementLabel: String,
    val colorScore: Int,
    val colorLabel: String,
)

data class CompatibilityResponse(
    val totalScore: Int,
    val level: String,
    val emoji: String,
    val breakdown: CompatibilityBreakdown,
    val summary: String,
)

// ─── Controller ──────────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/v1/ai")
class AiInsightController(
    private val insightRepository: UserAiInsightJpaRepository,
) {

    @GetMapping("/my-insights")
    fun getMyInsights(
        @AuthenticationPrincipal authUser: AuthUser,
    ): ResponseEntity<MyInsightsResponse> {
        val entity = insightRepository.findById(authUser.userId.value).orElse(null)
        return ResponseEntity.ok(
            MyInsightsResponse(
                attachmentStyle = entity?.attachmentStyle,
                loveLanguage = entity?.loveLanguage,
            ),
        )
    }

    @PostMapping("/attachment-style")
    fun saveAttachmentStyle(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: SaveInsightRequest,
    ): ResponseEntity<SaveInsightResponse> {
        val entity = insightRepository.findById(authUser.userId.value).orElse(
            UserAiInsightEntity(userId = authUser.userId.value),
        )
        entity.attachmentStyle = request.result
        entity.updatedAt = Instant.now()
        insightRepository.save(entity)
        return ResponseEntity.ok(
            SaveInsightResponse(
                attachmentStyle = entity.attachmentStyle,
                loveLanguage = entity.loveLanguage,
            ),
        )
    }

    @PostMapping("/love-language")
    fun saveLoveLanguage(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: SaveInsightRequest,
    ): ResponseEntity<SaveInsightResponse> {
        val entity = insightRepository.findById(authUser.userId.value).orElse(
            UserAiInsightEntity(userId = authUser.userId.value),
        )
        entity.loveLanguage = request.result
        entity.updatedAt = Instant.now()
        insightRepository.save(entity)
        return ResponseEntity.ok(
            SaveInsightResponse(
                attachmentStyle = entity.attachmentStyle,
                loveLanguage = entity.loveLanguage,
            ),
        )
    }

    @PostMapping("/compatibility")
    fun calculateCompatibility(
        @RequestBody request: CompatibilityRequest,
    ): ResponseEntity<CompatibilityResponse> {
        val response = CompatibilityCalculator.calculate(request)
        return ResponseEntity.ok(response)
    }

    // ─── Compatibility Calculator ─────────────────────────────────────────────

    companion object CompatibilityCalculator {

        fun calculate(request: CompatibilityRequest): CompatibilityResponse {
            val date1 = LocalDate.parse(request.birthDate1, DateTimeFormatter.ISO_LOCAL_DATE)
            val date2 = LocalDate.parse(request.birthDate2, DateTimeFormatter.ISO_LOCAL_DATE)

            val mbtiScore = calcMbtiScore(request.mbti1, request.mbti2)
            val zodiacScore = calcZodiacScore(date1, date2)
            val elementScore = calcElementScore(date1.year, date2.year)
            val colorScore = calcColorScore(request.colorType1, request.colorType2)

            val totalScore = (
                mbtiScore * 0.30 +
                    zodiacScore * 0.30 +
                    elementScore * 0.25 +
                    colorScore * 0.15
                ).toInt().coerceIn(0, 100)

            val level = when {
                totalScore >= 95 -> "운명적 인연"
                totalScore >= 85 -> "천생연분"
                totalScore >= 75 -> "잘 어울려요"
                totalScore >= 65 -> "노력이 필요해요"
                else -> "새로운 도전"
            }

            val emoji = when {
                totalScore >= 95 -> "💫"
                totalScore >= 85 -> "💕"
                totalScore >= 75 -> "😊"
                totalScore >= 65 -> "🤝"
                else -> "🌱"
            }

            val summary = buildSummary(totalScore, level, request.mbti1, request.mbti2)

            val breakdown = CompatibilityBreakdown(
                mbtiScore = mbtiScore,
                mbtiLabel = mbtiLabel(mbtiScore),
                zodiacScore = zodiacScore,
                zodiacLabel = scoreLabel(zodiacScore),
                elementScore = elementScore,
                elementLabel = scoreLabel(elementScore),
                colorScore = colorScore,
                colorLabel = scoreLabel(colorScore),
            )

            return CompatibilityResponse(
                totalScore = totalScore,
                level = level,
                emoji = emoji,
                breakdown = breakdown,
                summary = summary,
            )
        }

        // ─── MBTI ─────────────────────────────────────────────────────────────

        private val GOLDEN_PAIRS: Set<Pair<String, String>> = setOf(
            "INTJ" to "ENFP",
            "ENFP" to "INTJ",
            "INTP" to "ENTJ",
            "ENTJ" to "INTP",
            "INFJ" to "ENTP",
            "ENTP" to "INFJ",
            "INFP" to "ENFJ",
            "ENFJ" to "INFP",
            "ISTJ" to "ESFP",
            "ESFP" to "ISTJ",
            "ISFJ" to "ESTP",
            "ESTP" to "ISFJ",
            "ESTJ" to "ISFP",
            "ISFP" to "ESTJ",
            "ESFJ" to "ISTP",
            "ISTP" to "ESFJ",
        )

        private fun temperament(mbti: String): String = when {
            mbti.length < 4 -> "??"
            mbti.contains('N') && (mbti[2] == 'T') -> "NT"
            mbti.contains('N') && (mbti[2] == 'F') -> "NF"
            mbti.contains('S') && (mbti[2] == 'J') -> "SJ"
            mbti.contains('S') && (mbti[2] == 'P') -> "SP"
            else -> "??"
        }

        fun calcMbtiScore(mbti1: String?, mbti2: String?): Int {
            if (mbti1 == null || mbti2 == null) return 75
            val m1 = mbti1.uppercase()
            val m2 = mbti2.uppercase()
            if (m1 == m2) return 70
            if (GOLDEN_PAIRS.contains(m1 to m2)) return 92
            val t1 = temperament(m1)
            val t2 = temperament(m2)
            if (t1 == t2) return 80
            // Only I/E differs
            if (m1.drop(1) == m2.drop(1)) return 75
            return 65
        }

        private fun mbtiLabel(score: Int): String = when {
            score >= 90 -> "천생연분 MBTI"
            score >= 80 -> "잘 맞는 유형"
            score >= 75 -> "비슷한 성향"
            else -> "다양한 매력"
        }

        // ─── Zodiac ───────────────────────────────────────────────────────────

        private fun zodiacSign(date: LocalDate): String {
            val m = date.monthValue
            val d = date.dayOfMonth
            return when {
                (m == 3 && d >= 21) || (m == 4 && d <= 19) -> "Aries"
                (m == 4 && d >= 20) || (m == 5 && d <= 20) -> "Taurus"
                (m == 5 && d >= 21) || (m == 6 && d <= 20) -> "Gemini"
                (m == 6 && d >= 21) || (m == 7 && d <= 22) -> "Cancer"
                (m == 7 && d >= 23) || (m == 8 && d <= 22) -> "Leo"
                (m == 8 && d >= 23) || (m == 9 && d <= 22) -> "Virgo"
                (m == 9 && d >= 23) || (m == 10 && d <= 22) -> "Libra"
                (m == 10 && d >= 23) || (m == 11 && d <= 21) -> "Scorpio"
                (m == 11 && d >= 22) || (m == 12 && d <= 21) -> "Sagittarius"
                (m == 12 && d >= 22) || (m == 1 && d <= 19) -> "Capricorn"
                (m == 1 && d >= 20) || (m == 2 && d <= 18) -> "Aquarius"
                else -> "Pisces"
            }
        }

        private fun zodiacElement(sign: String): String = when (sign) {
            "Aries", "Leo", "Sagittarius" -> "Fire"
            "Taurus", "Virgo", "Capricorn" -> "Earth"
            "Gemini", "Libra", "Aquarius" -> "Air"
            else -> "Water"
        }

        fun calcZodiacScore(date1: LocalDate, date2: LocalDate): Int {
            val el1 = zodiacElement(zodiacSign(date1))
            val el2 = zodiacElement(zodiacSign(date2))
            return zodiacElementScore(el1, el2)
        }

        private fun zodiacElementScore(el1: String, el2: String): Int {
            if (el1 == el2) return 90
            val pair = setOf(el1, el2)
            return when {
                pair == setOf("Fire", "Air") -> 95
                pair == setOf("Earth", "Water") -> 90
                pair == setOf("Fire", "Earth") -> 65
                pair == setOf("Air", "Water") -> 70
                pair == setOf("Fire", "Water") -> 55
                pair == setOf("Earth", "Air") -> 70
                else -> 70
            }
        }

        // ─── Five Elements (사주 오행) ─────────────────────────────────────────

        private fun heavenlyStemElement(year: Int): String = when (year % 10) {
            0, 1 -> "Metal"
            2, 3 -> "Water"
            4, 5 -> "Wood"
            6, 7 -> "Fire"
            8, 9 -> "Earth"
            else -> "Earth"
        }

        fun calcElementScore(year1: Int, year2: Int): Int {
            val el1 = heavenlyStemElement(year1)
            val el2 = heavenlyStemElement(year2)
            if (el1 == el2) return 80
            // Promoting cycle: 목(Wood)→화(Fire)→토(Earth)→금(Metal)→수(Water)→목
            val promotingCycle = listOf("Wood", "Fire", "Earth", "Metal", "Water")
            val idx1 = promotingCycle.indexOf(el1)
            val idx2 = promotingCycle.indexOf(el2)
            if (idx1 >= 0 && idx2 >= 0) {
                if ((idx1 + 1) % 5 == idx2 || (idx2 + 1) % 5 == idx1) return 85
            }
            // Controlling cycle: 목(Wood)→토(Earth)→수(Water)→화(Fire)→금(Metal)→목
            val controllingCycle = listOf("Wood", "Earth", "Water", "Fire", "Metal")
            val cidx1 = controllingCycle.indexOf(el1)
            val cidx2 = controllingCycle.indexOf(el2)
            if (cidx1 >= 0 && cidx2 >= 0) {
                if ((cidx1 + 1) % 5 == cidx2 || (cidx2 + 1) % 5 == cidx1) return 55
            }
            return 70
        }

        // ─── Color Type ───────────────────────────────────────────────────────

        private val COLOR_HARMONY: Map<Pair<String, String>, Int> = buildMap {
            fun put2(a: String, b: String, score: Int) {
                put(a to b, score)
                put(b to a, score)
            }
            put2("WARM_ORANGE", "CALM_BLUE", 90)
            put2("VIBRANT_RED", "FRESH_GREEN", 85)
            put2("SOFT_PINK", "ELEGANT_PURPLE", 90)
            put2("BRIGHT_YELLOW", "SOPHISTICATED_GRAY", 85)
            put2("WARM_ORANGE", "FRESH_GREEN", 80)
            put2("CALM_BLUE", "SOFT_PINK", 80)
        }

        fun calcColorScore(color1: String?, color2: String?): Int {
            if (color1 == null || color2 == null) return 75
            if (color1 == color2) return 70
            return COLOR_HARMONY[color1 to color2] ?: 75
        }

        private fun scoreLabel(score: Int): String = when {
            score >= 90 -> "매우 좋음"
            score >= 80 -> "좋음"
            score >= 70 -> "보통"
            score >= 60 -> "주의"
            else -> "도전"
        }

        private fun buildSummary(score: Int, level: String, mbti1: String?, mbti2: String?): String {
            val mbtiPart = if (mbti1 != null && mbti2 != null) {
                "${mbti1}와 ${mbti2}의 조합은"
            } else {
                "두 분의 궁합은"
            }
            return when {
                score >= 95 -> "$mbtiPart 운명처럼 연결된 $level! 서로의 차이가 오히려 더 강한 끌림이 될 거예요."
                score >= 85 -> "$mbtiPart $level 수준이에요. 서로를 깊이 이해하고 성장할 수 있는 관계예요."
                score >= 75 -> "$mbtiPart $level 사이! 조금씩 맞춰가다 보면 멋진 인연이 될 수 있어요."
                score >= 65 -> "$mbtiPart $level 관계예요. 서로 다른 점을 존중하며 함께 노력한다면 충분히 행복할 수 있어요."
                else -> "$mbtiPart $level 사이지만, 진심 어린 노력과 대화가 모든 걸 바꿀 수 있어요."
            }
        }
    }
}
