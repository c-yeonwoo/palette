package kr.ai.palette.presentation.introduction

import kr.ai.palette.domain.auth.AuthUser
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 내친소 게시판 API 스캐폴딩 (NC-A3, P2-002).
 * Phase A 엔티티·동의 플로우 착수 전 — 빈 목록으로 프론트 진입점만 연결.
 */
@RestController
@RequestMapping("/api/v1/introduction-board")
class IntroductionBoardController {

    @GetMapping
    fun listPosts(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ResponseEntity<IntroductionBoardListResponse> {
        return ResponseEntity.ok(
            IntroductionBoardListResponse(
                items = emptyList(),
                totalCount = 0,
                page = page,
                size = size,
                message = "내친소 게시판은 준비 중이에요",
            )
        )
    }
}

data class IntroductionBoardListResponse(
    val items: List<IntroductionPostSummary>,
    val totalCount: Int,
    val page: Int,
    val size: Int,
    val message: String? = null,
)

data class IntroductionPostSummary(
    val id: String,
    val matchmakerName: String,
    val targetTeaser: String,
    val recommendation: String,
    val applicationCount: Int,
)
