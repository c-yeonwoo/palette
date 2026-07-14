package kr.ai.palette.persistence.daily

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.util.UUID

interface DailyAnswerJpaRepository : JpaRepository<DailyAnswerEntity, UUID> {
    fun findByUserIdAndAnswerDate(userId: String, answerDate: LocalDate): DailyAnswerEntity?
    fun findByUserIdAndAnswerDateBetweenOrderByAnswerDateDesc(
        userId: String,
        from: LocalDate,
        to: LocalDate,
    ): List<DailyAnswerEntity>
}
