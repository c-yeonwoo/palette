package kr.ai.palette.palettepick.application

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.Profile
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.palettepick.persistence.ProfileEmbeddingEntity
import kr.ai.palette.palettepick.persistence.ProfileEmbeddingJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Profile 도메인 → 자기소개/이상형 자연어 텍스트 → EmbeddingService 호출 (ADR 0047 §B.3a).
 *
 * 호출 시점:
 *  · PalettePick 추천 진입 시 lazy stale 체크 (`refreshIfStale`)
 *  · 배치 매일 자정 (B.3 PR)
 *
 * stale 판정: ProfileEmbedding 이 없거나, profile metadata.updatedAt > embedding.updatedAt.
 */
@Service
class EmbeddingRefreshService(
    private val profileRepository: ProfileRepository,
    private val embeddingRepository: ProfileEmbeddingJpaRepository,
    private val embeddingService: EmbeddingService,
) {

    private val log = LoggerFactory.getLogger(EmbeddingRefreshService::class.java)

    /**
     * stale 한 경우만 재임베딩. 최신이면 no-op.
     * 결과: 최신 embedding (없으면 null — Profile 없거나 텍스트 빔)
     */
    fun refreshIfStale(userId: UUID): ProfileEmbeddingEntity? {
        val profile = profileRepository.findByUserId(UserId(userId)) ?: return null
        val existing = embeddingRepository.findById(userId).orElse(null)
        if (existing != null && !profile.metadata.updatedAt.isAfter(existing.updatedAt)) {
            return existing  // 최신
        }
        val introText = buildIntroText(profile)
        val idealText = buildIdealText(profile)
        if (introText.isBlank() && idealText.isBlank()) {
            log.debug("임베딩 스킵 — 빈 프로필 user={}", userId)
            return existing
        }
        return embeddingService.refreshEmbedding(userId, introText, idealText)
    }

    /**
     * 후보 풀 일괄 stale 체크 (배치/orchestrator 용). N+1 회피 — 한 번에 임베딩 N 개 로드.
     */
    fun bulkRefreshIfStale(userIds: List<UUID>) {
        val embeddings = embeddingRepository.findByUserIdIn(userIds).associateBy { it.userId }
        userIds.forEach { uid ->
            val profile = profileRepository.findByUserId(UserId(uid)) ?: return@forEach
            val existing = embeddings[uid]
            if (existing != null && !profile.metadata.updatedAt.isAfter(existing.updatedAt)) return@forEach
            val introText = buildIntroText(profile)
            val idealText = buildIdealText(profile)
            if (introText.isBlank() && idealText.isBlank()) return@forEach
            embeddingService.refreshEmbedding(uid, introText, idealText)
        }
    }

    // ─── Profile → 자연어 텍스트 변환 ──────────────────────────

    /** "나는 어떤 사람인가" — 자기소개 + 인터뷰 + 관심사 + 색 reasoning. */
    internal fun buildIntroText(profile: Profile): String = buildString {
        profile.introduction.text?.takeIf { it.isNotBlank() }?.let {
            appendLine("[자기소개] $it")
        }
        profile.introduction.interviewAnswers?.let { ans ->
            val parts = listOfNotNull(
                ans.hobby?.let { "주말엔 $it" },
                ans.charm?.let { "내 매력은 $it" },
                ans.passion?.let { "요즘 빠진 것: $it" },
                ans.happiness?.let { "행복할 때: $it" },
                ans.motto?.let { "좌우명: $it" },
            )
            if (parts.isNotEmpty()) appendLine("[인터뷰] " + parts.joinToString(" · "))
        }
        if (profile.introduction.interests.isNotEmpty()) {
            appendLine("[관심사] " + profile.introduction.interests.joinToString(", "))
        }
        profile.colorType?.reasoning?.takeIf { it.isNotBlank() }?.let {
            appendLine("[색 분석] $it")
        }
        profile.colorType?.name?.takeIf { it.isNotBlank() }?.let {
            appendLine("[내 색] $it")
        }
        profile.colorType?.personalitySummary?.takeIf { it.isNotBlank() }?.let {
            appendLine("[성향] $it")
        }
    }.trim()

    /** "내가 원하는 사람" — 이상형 정보 자연어. */
    internal fun buildIdealText(profile: Profile): String = buildString {
        val ideal = profile.idealType
        if (ideal.personalities.isNotEmpty()) {
            appendLine("[선호 성격] " + ideal.personalities.joinToString(", "))
        }
        if (ideal.datePreferences.isNotEmpty()) {
            appendLine("[데이트 스타일] " + ideal.datePreferences.joinToString(", ") {
                DATE_PREF_LABEL[it.name] ?: it.name
            })
        }
        if (ideal.importantValues.isNotEmpty()) {
            appendLine("[중요한 가치] " + ideal.importantValues.joinToString(", ") {
                IMPORTANT_VALUE_LABEL[it.name] ?: it.name
            })
        }
        if (ideal.dealBreakers.isNotEmpty()) {
            appendLine("[절대 안 되는 것] " + ideal.dealBreakers.joinToString(", ") {
                DEAL_BREAKER_LABEL[it.name] ?: it.name
            })
        }
        if (ideal.bucketList.isNotEmpty()) {
            appendLine("[버킷리스트] " + ideal.bucketList.joinToString(", "))
        }
        profile.colorType?.idealTypeInsight?.takeIf { it.isNotBlank() }?.let {
            appendLine("[원하는 인연] $it")
        }
    }.trim()

    companion object {
        private val DATE_PREF_LABEL = mapOf(
            "ACTIVE" to "액티브",
            "INDOOR" to "인도어",
            "CULTURE" to "문화",
            "NATURE" to "자연",
        )
        private val IMPORTANT_VALUE_LABEL = mapOf(
            "PERSONALITY" to "성격", "APPEARANCE" to "외모", "EDUCATION" to "학력",
            "CAREER" to "능력·커리어", "FAMILY" to "집안", "JOB" to "직업",
            "WEALTH" to "경제력", "VALUES" to "가치관",
        )
        private val DEAL_BREAKER_LABEL = mapOf(
            "SMOKING" to "흡연", "HEAVY_DRINKING" to "과음", "DISLIKES_PETS" to "반려동물 싫음",
            "LONG_DISTANCE" to "장거리", "DIFFERENT_RELIGION" to "종교 차이",
            "NO_MARRIAGE_PLAN" to "결혼 계획 없음", "CHILDREN_PLAN" to "자녀 계획 차이",
            "UNSTABLE_JOB" to "직업 불안정", "CONTACTS_EX" to "전 연인 연락", "LARGE_AGE_GAP" to "나이 차 큼",
        )
    }
}
