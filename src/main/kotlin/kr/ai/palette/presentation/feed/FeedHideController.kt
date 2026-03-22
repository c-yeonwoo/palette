package kr.ai.palette.presentation.feed

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.concurrent.ConcurrentHashMap

@RestController
@RequestMapping("/api/v1/feed/hide")
class FeedHideController {

    companion object {
        // userId.toString() → set of hidden targetUserId strings
        private val store = ConcurrentHashMap<String, MutableSet<String>>()

        fun isHidden(userId: UserId, targetUserId: UserId): Boolean =
            store[userId.value.toString()]?.contains(targetUserId.value.toString()) == true

        fun getHiddenIds(userId: UserId): Set<String> =
            store[userId.value.toString()] ?: emptySet()
    }

    @PostMapping("/{targetUserId}")
    fun hide(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: String
    ): ResponseEntity<Unit> {
        store.getOrPut(authUser.userId.value.toString()) { ConcurrentHashMap.newKeySet() }
            .add(targetUserId)
        return ResponseEntity.ok().build()
    }

    @DeleteMapping("/{targetUserId}")
    fun unhide(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: String
    ): ResponseEntity<Unit> {
        store[authUser.userId.value.toString()]?.remove(targetUserId)
        return ResponseEntity.ok().build()
    }

    @GetMapping
    fun list(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<HiddenProfilesResponse> {
        val ids = store[authUser.userId.value.toString()]?.toList() ?: emptyList()
        return ResponseEntity.ok(HiddenProfilesResponse(ids))
    }
}

data class HiddenProfilesResponse(val hiddenUserIds: List<String>)
