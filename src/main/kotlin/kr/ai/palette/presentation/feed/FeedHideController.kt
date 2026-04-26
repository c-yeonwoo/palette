package kr.ai.palette.presentation.feed

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.persistence.feed.FeedHideEntity
import kr.ai.palette.persistence.feed.FeedHideJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/feed/hide")
class FeedHideController(
    private val feedHideRepository: FeedHideJpaRepository,
) {

    @PostMapping("/{targetUserId}")
    fun hide(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: String
    ): ResponseEntity<Unit> {
        val myIdStr = authUser.userId.value.toString()
        if (!feedHideRepository.existsByUserIdAndTargetUserId(myIdStr, targetUserId)) {
            feedHideRepository.save(FeedHideEntity(userId = myIdStr, targetUserId = targetUserId))
        }
        return ResponseEntity.ok().build()
    }

    @Transactional
    @DeleteMapping("/{targetUserId}")
    fun unhide(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: String
    ): ResponseEntity<Unit> {
        feedHideRepository.deleteByUserIdAndTargetUserId(authUser.userId.value.toString(), targetUserId)
        return ResponseEntity.ok().build()
    }

    @GetMapping
    fun list(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<HiddenProfilesResponse> {
        val ids = feedHideRepository.findAllByUserId(authUser.userId.value.toString())
            .map { it.targetUserId }
        return ResponseEntity.ok(HiddenProfilesResponse(ids))
    }
}

data class HiddenProfilesResponse(val hiddenUserIds: List<String>)
