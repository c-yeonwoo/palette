package kr.ai.palette.domain.profile

data class Introduction(
    val text: String?,
    val interests: List<String>,
    val interviewAnswers: InterviewAnswers? = null
)

data class InterviewAnswers(
    val hobby: String?,        // 쉬는 날엔 주로 이렇게 시간을 보내요
    val charm: String?,        // 제 매력 포인트는 바로 이거!
    val passion: String?,      // 요즘 제가 푹 빠져있는 것
    val happiness: String?,    // 저는 이럴 때 행복해요
    val motto: String?         // 제 인생의 좌우명은
)
