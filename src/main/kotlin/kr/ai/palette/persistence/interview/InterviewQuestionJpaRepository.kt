package kr.ai.palette.persistence.interview

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface InterviewQuestionJpaRepository : JpaRepository<InterviewQuestionEntity, UUID> {
    fun findByActiveTrueOrderByDisplayOrderAsc(): List<InterviewQuestionEntity>
    fun findAllByOrderByDisplayOrderAsc(): List<InterviewQuestionEntity>
    fun existsByQuestionKey(questionKey: String): Boolean
}
