package kr.ai.palette.domain.daily

/**
 * 일일 질문 풀 — dayOfYear % size 로 회전.
 * 칩 선택 또는 짧은 텍스트 답변. 리텐션용 (지인망과 무관하게 매일 방문 이유).
 */
data class DailyQuestion(
    val id: String,
    val text: String,
    val hint: String?,
    val chips: List<String>,
)

object DailyQuestionPool {
    val QUESTIONS: List<DailyQuestion> = listOf(
        DailyQuestion(
            id = "q_spark",
            text = "요즘 나를 설레게 한 건?",
            hint = "사람·장소·취향 뭐든 괜찮아요",
            chips = listOf("좋은 대화", "작은 여행", "맛있는 한 끼", "새로운 취미", "따뜻한 응원"),
        ),
        DailyQuestion(
            id = "q_weekend",
            text = "이번 주말에 가장 끌리는 건?",
            hint = "한 가지만 골라보세요",
            chips = listOf("카페에서 쉬기", "산책·러닝", "전시·공연", "집콕 충전", "친구 만나기"),
        ),
        DailyQuestion(
            id = "q_first_date",
            text = "첫 만남에 어울리는 분위기는?",
            hint = "부담 없는 쪽을 골라주세요",
            chips = listOf("낮 카페", "저녁 식사", "산책", "전시·영화", "취미 클래스"),
        ),
        DailyQuestion(
            id = "q_energy",
            text = "오늘 내 에너지 상태는?",
            hint = null,
            chips = listOf("활발해요", "차분해요", "조금 지쳐요", "설레요", "평온해요"),
        ),
        DailyQuestion(
            id = "q_value",
            text = "관계에서 제일 소중한 건?",
            hint = null,
            chips = listOf("솔직한 대화", "서로를 존중", "비슷한 속도", "유머", "안정감"),
        ),
        DailyQuestion(
            id = "q_color_mood",
            text = "오늘의 나를 색으로 표현하면?",
            hint = "느낌만으로 골라도 돼요",
            chips = listOf("따뜻한 오렌지", "고요한 블루", "설레는 핑크", "싱그러운 그린", "깊은 퍼플"),
        ),
        DailyQuestion(
            id = "q_recharge",
            text = "나를 다시 채우는 방법은?",
            hint = null,
            chips = listOf("혼자만의 시간", "가까운 사람", "운동", "음악·영상", "맛있는 것"),
        ),
    )

    fun forDate(dayOfYear: Int): DailyQuestion {
        val idx = Math.floorMod(dayOfYear - 1, QUESTIONS.size)
        return QUESTIONS[idx]
    }

    fun byId(id: String): DailyQuestion? = QUESTIONS.find { it.id == id }
}
