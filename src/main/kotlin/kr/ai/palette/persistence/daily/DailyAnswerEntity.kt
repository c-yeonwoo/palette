package kr.ai.palette.persistence.daily

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(
    name = "daily_answers",
    uniqueConstraints = [UniqueConstraint(name = "uk_daily_answer_user_date", columnNames = ["user_id", "answer_date"])],
    indexes = [Index(name = "idx_daily_answer_user", columnList = "user_id")]
)
class DailyAnswerEntity(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false, length = 36)
    val userId: String,

    @Column(name = "answer_date", nullable = false)
    val answerDate: LocalDate,

    @Column(name = "question_id", nullable = false, length = 64)
    val questionId: String,

    @Column(name = "answer_text", nullable = false, length = 120)
    val answerText: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
)
