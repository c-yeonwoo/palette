package kr.ai.palette.presentation.admin

import kr.ai.palette.persistence.safety.ReportJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

/**
 * 운영자 신고 검토 (어뷰징 방지 — ADR 0023). admin API 는 hasRole(ADMIN) 강제.
 */
@RestController
@RequestMapping("/api/v1/admin/reports")
class AdminReportsController(
    private val reportJpaRepository: ReportJpaRepository,
) {
    @GetMapping
    fun list(@RequestParam(required = false) status: String?): ResponseEntity<List<Map<String, Any?>>> {
        val reports = if (status != null) {
            reportJpaRepository.findByStatusOrderByCreatedAtDesc(status.uppercase())
        } else {
            reportJpaRepository.findAllByOrderByCreatedAtDesc()
        }
        return ResponseEntity.ok(reports.map {
            mapOf(
                "id" to it.id.toString(),
                "reporterUserId" to it.reporterUserId.toString(),
                "reportedUserId" to it.reportedUserId.toString(),
                "reason" to it.reason,
                "detail" to it.detail,
                "status" to it.status,
                "createdAt" to it.createdAt.toString(),
            )
        })
    }

    @PatchMapping("/{id}/review")
    @Transactional
    fun markReviewed(@PathVariable id: UUID): ResponseEntity<Map<String, Any?>> {
        val report = reportJpaRepository.findById(id).orElse(null)
            ?: return ResponseEntity.notFound().build()
        report.status = "REVIEWED"
        reportJpaRepository.save(report)
        return ResponseEntity.ok(mapOf("success" to true, "status" to "REVIEWED", "reviewedAt" to Instant.now().toString()))
    }
}
