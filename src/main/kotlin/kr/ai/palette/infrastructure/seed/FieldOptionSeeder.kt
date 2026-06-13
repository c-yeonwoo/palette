package kr.ai.palette.infrastructure.seed

import kr.ai.palette.persistence.option.FieldOptionEntity
import kr.ai.palette.persistence.option.FieldOptionJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * 온보딩 칩 옵션 기본값 시드 (ADR 0057). 테이블이 비어있을 때만 1회.
 * 현재 enum 값(code) + 한글 라벨로 시드 → 현행 동작 보존. 이후 어드민이 자유 관리.
 */
@Component
@Order(52)
class FieldOptionSeeder(
    private val repository: FieldOptionJpaRepository,
) : ApplicationRunner {
    private val logger = LoggerFactory.getLogger(FieldOptionSeeder::class.java)

    @Transactional
    override fun run(args: ApplicationArguments) {
        if (repository.count() > 0L) return
        var n = 0
        SEED.forEach { (setKey, gender, pairs) ->
            pairs.forEachIndexed { idx, (code, label) ->
                repository.save(
                    FieldOptionEntity(setKey = setKey, code = code, label = label, displayOrder = idx, gender = gender),
                )
                n++
            }
        }
        logger.info("필드 옵션 기본 {}개 시드 완료 ({} 세트)", n, SEED.size)
    }

    companion object {
        // (setKey, gender?, [code to label])
        private val SEED: List<Triple<String, String?, List<Pair<String, String>>>> = listOf(
            Triple("bodyType", null, listOf(
                "SLIM" to "슬림", "AVERAGE" to "보통", "ATHLETIC" to "탄탄", "MUSCULAR" to "건장", "CURVY" to "통통",
            )),
            Triple("religion", null, listOf(
                "NONE" to "무교", "CHRISTIANITY" to "기독교", "CATHOLICISM" to "천주교", "BUDDHISM" to "불교", "OTHER" to "기타",
            )),
            Triple("smoking", null, listOf("NEVER" to "비흡연", "SOMETIMES" to "가끔", "OFTEN" to "자주")),
            Triple("drinking", null, listOf("NEVER" to "안 마심", "SOMETIMES" to "가끔", "OFTEN" to "자주")),
            Triple("datePreference", null, listOf(
                "ACTIVE" to "액티브", "INDOOR" to "실내", "CULTURE" to "문화", "NATURE" to "자연",
            )),
            Triple("importantValue", null, listOf(
                "PERSONALITY" to "성격/성향", "APPEARANCE" to "외모", "EDUCATION" to "학력", "CAREER" to "능력/커리어",
                "FAMILY" to "집안/가족", "JOB" to "직업", "WEALTH" to "경제력", "VALUES" to "가치관",
            )),
            Triple("dealBreaker", null, listOf(
                "SMOKING" to "흡연자", "HEAVY_DRINKING" to "과음하는 사람", "DISLIKES_PETS" to "반려동물을 싫어하는 사람",
                "LONG_DISTANCE" to "장거리 연애", "DIFFERENT_RELIGION" to "종교가 다른 사람", "NO_MARRIAGE_PLAN" to "결혼 의사가 없는 사람",
                "CHILDREN_PLAN" to "자녀 계획이 맞지 않는 사람", "UNSTABLE_JOB" to "직업이 불안정한 사람",
                "CONTACTS_EX" to "전 연인과 연락하는 사람", "LARGE_AGE_GAP" to "나이 차이가 많이 나는 사람",
            )),
            // 자유 서술형 — code 가 곧 한글(현행 저장 방식)
            Triple("personality", null, listOf(
                "유머있는", "다정한", "지적인", "활발한", "차분한", "섬세한", "솔직한", "적극적인", "배려심많은", "독립적인",
            ).map { it to it }),
            Triple("interest", null, listOf(
                "운동", "맛집", "영화", "여행", "독서", "음악", "카페", "전시", "공연", "사진",
                "요리", "와인", "캠핑", "드라이브", "게임", "반려동물", "패션", "글쓰기", "그림", "재테크",
            ).map { it to it }),
            // 외모상 — 성별 한정
            Triple("appearanceStyle", "FEMALE", listOf(
                "PUPPY" to "강아지상", "CAT" to "고양이상", "RABBIT" to "토끼상", "FOX" to "여우상", "DEER" to "사슴상",
                "TOFU" to "두부상", "SOFT_TOFU" to "순두부상", "ARAB" to "아랍상", "BOSS" to "일진상", "MOTHER_IN_LAW_APPROVED" to "상견례입구컷상",
            )),
            Triple("appearanceStyle", "MALE", listOf(
                "PUPPY" to "강아지상", "CAT" to "고양이상", "STUDENT_COUNCIL" to "전교회장상", "ATHLETIC" to "체대상",
                "NERD" to "너드상", "TOFU" to "두부상", "ARAB" to "아랍상", "DINOSAUR" to "공룡상",
            )),
        )
    }
}
