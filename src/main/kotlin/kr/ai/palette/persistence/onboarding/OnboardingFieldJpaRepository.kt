package kr.ai.palette.persistence.onboarding

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface OnboardingFieldJpaRepository : JpaRepository<OnboardingFieldEntity, UUID> {
    /** 사용자 온보딩용 — 활성 필드만 섹션·필드 순서대로 */
    fun findByActiveTrueOrderBySectionOrderAscFieldOrderAsc(): List<OnboardingFieldEntity>

    /** 어드민 — 비활성 포함 전체 */
    fun findAllByOrderBySectionOrderAscFieldOrderAsc(): List<OnboardingFieldEntity>

    fun existsByFieldKey(fieldKey: String): Boolean
}
