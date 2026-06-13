package kr.ai.palette.infrastructure.seed

import kr.ai.palette.persistence.interview.InterviewQuestionEntity
import kr.ai.palette.persistence.interview.InterviewQuestionJpaRepository
import kr.ai.palette.presentation.ai.AIInterviewController
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * AI 인터뷰 질문 기본값 시드 (ADR 0055). 모든 프로파일에서 실행되며 테이블이 비어있을 때만 1회.
 * 기본 질문 소스는 AIInterviewController.INTERVIEW_QUESTIONS (하드코딩 → DB 이관의 단일 출처).
 */
@Component
@Order(50)
class InterviewQuestionSeeder(
    private val repository: InterviewQuestionJpaRepository,
) : ApplicationRunner {
    private val logger = LoggerFactory.getLogger(InterviewQuestionSeeder::class.java)

    @Transactional
    override fun run(args: ApplicationArguments) {
        if (repository.count() > 0L) return
        AIInterviewController.INTERVIEW_QUESTIONS.forEach { q ->
            repository.save(
                InterviewQuestionEntity(
                    questionKey = q.id,
                    displayOrder = q.step,
                    category = q.category,
                    question = q.question,
                    hint = q.hint,
                    inputType = q.inputType,
                    chips = q.chips.takeIf { it.isNotEmpty() }?.joinToString("\n"),
                    active = true,
                )
            )
        }
        logger.info("AI 인터뷰 질문 기본 {}개 시드 완료", AIInterviewController.INTERVIEW_QUESTIONS.size)
    }
}
