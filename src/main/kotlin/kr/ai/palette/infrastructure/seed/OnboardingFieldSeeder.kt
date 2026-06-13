package kr.ai.palette.infrastructure.seed

import kr.ai.palette.persistence.onboarding.OnboardingFieldEntity
import kr.ai.palette.persistence.onboarding.OnboardingFieldJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * 온보딩 필드 메타 기본값 시드 (ADR 0058). 테이블이 비어있을 때만 1회.
 * 현재 BasicInfo/AboutMe/IdealType 3개 화면의 필드·순서·라벨·위젯을 그대로 재현 →
 * PR 3b 프론트 렌더러가 이 메타로 동일 동작을 내도록(현행 보존). 이후 어드민이 자유 관리.
 */
@Component
@Order(54)
class OnboardingFieldSeeder(
    private val repository: OnboardingFieldJpaRepository,
) : ApplicationRunner {
    private val logger = LoggerFactory.getLogger(OnboardingFieldSeeder::class.java)

    @Transactional
    override fun run(args: ApplicationArguments) {
        if (repository.count() > 0L) return
        SEED.forEachIndexed { _, f -> repository.save(f) }
        logger.info("온보딩 필드 기본 {}개 시드 완료", SEED.size)
    }

    companion object {
        private fun field(
            key: String, section: String, sectionOrder: Int, fieldOrder: Int,
            label: String, inputType: String, hint: String? = null,
            optionSetKey: String? = null, required: Boolean = false, config: String? = null,
        ) = OnboardingFieldEntity(
            fieldKey = key, section = section, sectionOrder = sectionOrder, fieldOrder = fieldOrder,
            label = label, hint = hint, inputType = inputType, optionSetKey = optionSetKey,
            required = required, config = config,
        )

        // 현행 3개 화면 충실 재현. optionSetKey 가 있으면 field_options(ADR 0057) 동적 칩,
        // null 이면 프론트 위젯 자체 보유(고정 enum·자유입력·특수 위젯).
        private val SEED: List<OnboardingFieldEntity> = listOf(
            // ── basic (기본 정보) ──────────────────────────────
            field("name", "basic", 1, 1, "이름", "text", hint = "상대방에게는 이름이 공개되지 않아요", required = true),
            field("birthDate", "basic", 1, 2, "생년월일", "date", required = true),
            field("gender", "basic", 1, 3, "성별", "gender", required = true),
            field("height", "basic", 1, 4, "키", "slider",
                config = """{"min":140,"max":220,"unit":"cm","default":170}"""),
            field("bodyType", "basic", 1, 5, "체형", "singleChip", optionSetKey = "bodyType"),
            field("mbti", "basic", 1, 6, "MBTI", "mbti"),
            field("jobCategory", "basic", 1, 7, "직업 분야", "singleChip", required = true),
            field("education", "basic", 1, 8, "최종 학력", "singleChip", hint = "선택"),
            field("region", "basic", 1, 9, "거주 지역", "singleChip", required = true),

            // ── about (자기소개·라이프스타일) ──────────────────
            field("interview", "about", 2, 1, "인터뷰로 나를 소개해요", "interview",
                hint = "5가지 질문 중 최소 3가지에 답해주세요", required = true,
                config = """{"minAnswers":3}"""),
            field("smoking", "about", 2, 2, "흡연", "singleChip", optionSetKey = "smoking", required = true),
            field("drinking", "about", 2, 3, "음주", "singleChip", optionSetKey = "drinking", required = true),
            field("religion", "about", 2, 4, "종교", "singleChip", hint = "선택", optionSetKey = "religion"),
            field("interests", "about", 2, 5, "관심사 · 취미", "multiChip", hint = "최대 8개",
                optionSetKey = "interest", config = """{"maxSelect":8}"""),

            // ── ideal (이상형) ─────────────────────────────────
            field("ageRange", "ideal", 3, 1, "나이 범위", "rangeSlider", hint = "선택",
                config = """{"min":20,"max":60,"unit":"세","defaultMin":25,"defaultMax":35}"""),
            field("heightRange", "ideal", 3, 2, "키 범위", "rangeSlider", hint = "선택",
                config = """{"min":140,"max":200,"unit":"cm","defaultMin":160,"defaultMax":180}"""),
            field("datePreference", "ideal", 3, 3, "선호하는 데이트", "multiChip", hint = "복수 선택 가능",
                optionSetKey = "datePreference", required = true),
            field("importantValue", "ideal", 3, 4, "중요하게 보는 가치", "rankedChip", hint = "최대 3개",
                optionSetKey = "importantValue", required = true, config = """{"maxSelect":3}"""),
            field("personality", "ideal", 3, 5, "선호하는 성격", "multiChip", hint = "최대 5개",
                optionSetKey = "personality", required = true, config = """{"maxSelect":5}"""),
            field("appearanceStyle", "ideal", 3, 6, "선호 외모 스타일", "singleChip", hint = "하나만 선택 (선택사항)",
                optionSetKey = "appearanceStyle"),
            field("dealBreaker", "ideal", 3, 7, "절대 안되는 것", "multiChip", hint = "최대 3개 (선택)",
                optionSetKey = "dealBreaker", config = """{"maxSelect":3}"""),
        )
    }
}
