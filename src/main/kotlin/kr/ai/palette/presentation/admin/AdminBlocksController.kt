package kr.ai.palette.presentation.admin

import kr.ai.palette.persistence.safety.BlockJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * 어드민 — 유저 차단 관계 조회·해제 (ADR 0023).
 * 운영자 응대: 사용자가 실수로 차단했거나 어뷰징 신고 후 차단 해제 요청 시.
 *
 * /api/v1/admin/&#42;&#42; 패스라 SecurityConfig hasRole("ADMIN") 강제.
 */
@RestController
@RequestMapping("/api/v1/admin/blocks")
class AdminBlocksController(
    private val blockJpaRepository: BlockJpaRepository,
) {

    /** 전체 차단 관계 — 최근 생성순 (limit 200). 운영자가 패턴 모니터링용. */
    @GetMapping
    fun list(
        @RequestParam(required = false) blockerUserId: String?,
    ): ResponseEntity<List<Map<String, Any?>>> {
        val items = if (!blockerUserId.isNullOrBlank()) {
            try {
                blockJpaRepository.findByBlockerUserId(UUID.fromString(blockerUserId.trim()))
            } catch (e: IllegalArgumentException) {
                return ResponseEntity.badRequest().body(emptyList())
            }
        } else {
            blockJpaRepository.findAll().sortedByDescending { it.createdAt }.take(200)
        }
        return ResponseEntity.ok(
            items.map {
                mapOf(
                    "id" to it.id.toString(),
                    "blockerUserId" to it.blockerUserId.toString(),
                    "blockedUserId" to it.blockedUserId.toString(),
                    "createdAt" to it.createdAt.toString(),
                )
            }
        )
    }

    /** 차단 강제 해제 (예: 오신고 사용자 복구) */
    @DeleteMapping("/{id}")
    @Transactional
    fun unblock(@PathVariable id: UUID): ResponseEntity<Map<String, Any?>> {
        val block = blockJpaRepository.findById(id).orElse(null)
            ?: return ResponseEntity.notFound().build()
        blockJpaRepository.deleteById(id)
        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "id" to id.toString(),
                "blockerUserId" to block.blockerUserId.toString(),
                "blockedUserId" to block.blockedUserId.toString(),
            )
        )
    }
}
