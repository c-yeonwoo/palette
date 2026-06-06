package kr.ai.palette.persistence.safety

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ReportJpaRepository : JpaRepository<ReportEntity, UUID> {
    fun findAllByOrderByCreatedAtDesc(): List<ReportEntity>
    fun findByStatusOrderByCreatedAtDesc(status: String): List<ReportEntity>
    fun countByReportedUserId(reportedUserId: UUID): Long
    fun existsByReporterUserIdAndReportedUserId(reporterUserId: UUID, reportedUserId: UUID): Boolean
}
