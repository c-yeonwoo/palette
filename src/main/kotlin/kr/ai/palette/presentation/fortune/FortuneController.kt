package kr.ai.palette.presentation.fortune

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.user.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

data class FortuneResponse(
    val date: String,
    val title: String,
    val message: String,
    val luckyColor: String,
    val luckyColorHex: String,
    val luckyNumber: Int,
    val compatibilityHint: String,
    val loveScore: Int  // 1-5
)

@RestController
@RequestMapping("/api/v1/fortune")
class FortuneController(
    private val userRepository: UserRepository
) {

    @GetMapping("/today")
    fun getTodayFortune(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<FortuneResponse> {
        val user = userRepository.findById(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        val today = LocalDate.now()
        // 날짜 + userId 기반으로 하루 동안 동일한 운세 생성
        val seed = (today.toEpochDay() + authUser.userId.value.leastSignificantBits).toInt()
        val fortune = generateFortune(seed, user.publicInfo.gender.name)

        return ResponseEntity.ok(fortune.copy(date = today.toString()))
    }

    companion object {
        fun generateFortune(seed: Long, gender: String): FortuneResponse =
            generateFortune(seed.toInt(), gender)

        fun generateFortune(seed: Int, gender: String): FortuneResponse {
            val absSeed = Math.abs(seed)
            val today = LocalDate.now().toString()

            val titles = listOf(
                "오늘은 새로운 인연의 문이 열리는 날",
                "설레임이 가득한 하루가 될 거예요",
                "진심이 통하는 특별한 순간이 찾아와요",
                "당신의 매력이 가장 빛나는 날",
                "좋은 소식이 기다리고 있어요",
                "운명적인 만남의 기운이 강해요",
                "솔직한 표현이 좋은 결과를 가져와요",
                "차분하게 마음을 열어보는 날",
                "기대하지 않은 곳에서 인연이 피어나요",
                "오늘의 용기가 내일의 행복이 됩니다"
            )

            val messages = listOf(
                "오늘은 평소보다 활발하게 소통해 보세요. 먼저 연락하는 작은 용기가 큰 인연을 만들 수 있어요. 상대방의 이야기에 집중하며 진심을 담아 대화해 보세요.",
                "오늘 만나는 사람에게 평소보다 조금 더 미소를 보내보세요. 따뜻한 첫인상이 오래 기억됩니다. 당신의 진심은 반드시 전달될 거예요.",
                "마음속에 담아두었던 말을 꺼내기 좋은 날이에요. 완벽한 타이밍을 기다리기보다 지금 이 순간이 바로 그 때입니다.",
                "오늘은 당신의 장점이 자연스럽게 빛나는 날이에요. 있는 그대로의 모습을 보여주세요. 꾸밈없는 진심이 가장 큰 매력이랍니다.",
                "기다려온 연락이 올 수도 있어요. 핸드폰을 자주 확인해 보세요. 작은 신호도 놓치지 마세요.",
                "공통된 관심사를 가진 사람과 깊은 대화를 나눌 기회가 생길 거예요. 취미나 꿈에 대해 편하게 이야기해 보세요.",
                "오늘은 상대방의 말보다 행동에 주목해 보세요. 말하지 않은 감정 속에 진심이 담겨있을 수 있어요.",
                "급하게 결정하기보다 천천히 감정을 확인해 가는 날이에요. 서두르지 않아도 괜찮아요. 좋은 인연은 기다려줍니다.",
                "평소와 다른 경로로 출퇴근해 보세요. 예상치 못한 만남이 새로운 시작이 될 수 있어요.",
                "오늘의 긍정적인 에너지가 주변 사람들에게도 전해져요. 밝은 표정과 자신감 있는 태도가 최고의 매력 포인트예요."
            )

            val compatibilityHints = if (gender == "MALE") listOf(
                "오늘은 밝고 활발한 Orange 타입과 특히 잘 맞아요",
                "차분하고 깊이 있는 Blue 타입과 좋은 대화를 나눌 수 있어요",
                "따뜻하고 감성적인 Pink 타입이 당신 곁에 어울려요",
                "열정적인 Red 타입과 함께라면 오늘 하루가 더 빛날 거예요",
                "안정적이고 신뢰감 있는 Green 타입과 깊어지는 인연이 있어요"
            ) else listOf(
                "듬직하고 신뢰감 있는 Blue 타입과 좋은 케미가 생겨요",
                "활기차고 긍정적인 Orange 타입과 즐거운 시간을 보낼 수 있어요",
                "열정적이고 추진력 있는 Red 타입에게 오늘 끌릴 수 있어요",
                "지적이고 창의적인 Purple 타입과 특별한 대화가 이어져요",
                "따뜻하고 배려 깊은 Green 타입과 편안한 하루를 보내요"
            )

            val luckyColors = listOf(
                Pair("로즈 핑크", "#FF6B8A"),
                Pair("코랄 오렌지", "#FF7F50"),
                Pair("라벤더 퍼플", "#9B59B6"),
                Pair("스카이 블루", "#5DADE2"),
                Pair("민트 그린", "#48C9B0"),
                Pair("골든 옐로우", "#F4D03F"),
                Pair("피치", "#FFCBA4"),
                Pair("아이보리", "#FFFFF0")
            )

            val titleIdx = absSeed % titles.size
            val messageIdx = (absSeed / 10) % messages.size
            val compatIdx = (absSeed / 100) % compatibilityHints.size
            val colorIdx = (absSeed / 1000) % luckyColors.size
            val loveScore = (absSeed % 5) + 1
            val luckyNumber = (absSeed % 99) + 1

            return FortuneResponse(
                date = today,
                title = titles[titleIdx],
                message = messages[messageIdx],
                luckyColor = luckyColors[colorIdx].first,
                luckyColorHex = luckyColors[colorIdx].second,
                luckyNumber = luckyNumber,
                compatibilityHint = compatibilityHints[compatIdx],
                loveScore = loveScore
            )
        }
    }
}
