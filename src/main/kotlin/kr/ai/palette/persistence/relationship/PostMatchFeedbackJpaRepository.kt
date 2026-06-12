package kr.ai.palette.persistence.relationship

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface PostMatchFeedbackJpaRepository : JpaRepository<PostMatchFeedbackEntity, UUID> {

    /** 주선자 대시보드 — 내가 주선한 매칭의 후기 (최신순) */
    fun findByMatchmakerUserIdOrderByCreatedAtDesc(matchmakerUserId: UUID): List<PostMatchFeedbackEntity>

    /** 멱등 — 한 매칭당 작성자 1회 */
    fun findByRequestIdAndAuthorUserId(requestId: UUID, authorUserId: UUID): PostMatchFeedbackEntity?

    /** 운영자 — 특정 사용자가 받은 후기 (반복 DISAPPOINTING·노쇼 패턴 분석) */
    fun findByCounterpartUserId(counterpartUserId: UUID): List<PostMatchFeedbackEntity>
}
