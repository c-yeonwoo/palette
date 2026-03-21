package kr.ai.palette.presentation.profile

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@RestController
@RequestMapping("/api/v1/share")
class ShareLinkController(
    private val profileRepository: ProfileRepository,
    private val userRepository: UserRepository
) {

    @PostMapping("/link")
    fun createShareLink(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: CreateShareLinkRequest
    ): ResponseEntity<ShareLinkResponse> {
        val expiresAt = when (request.expiry) {
            "7d" -> Instant.now().plusSeconds(7 * 24 * 3600)
            "30d" -> Instant.now().plusSeconds(30 * 24 * 3600)
            else -> null // unlimited
        }

        val existing = shareLinkStore.values.firstOrNull { it.userId == authUser.userId.value }
        if (existing != null) {
            val updated = existing.copy(expiresAt = expiresAt, updatedAt = Instant.now())
            shareLinkStore[existing.code] = updated
            return ResponseEntity.ok(updated.toResponse())
        }

        val code = UUID.randomUUID().toString().replace("-", "").take(8)
        val link = ShareLinkData(
            code = code,
            userId = authUser.userId.value,
            viewCount = 0,
            expiresAt = expiresAt,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        shareLinkStore[code] = link
        return ResponseEntity.ok(link.toResponse())
    }

    @GetMapping("/link/me")
    fun getMyShareLink(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<ShareLinkResponse> {
        val link = shareLinkStore.values.firstOrNull { it.userId == authUser.userId.value }
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(link.toResponse())
    }

    @GetMapping("/{code}")
    fun resolveShareLink(@PathVariable code: String): ResponseEntity<ShareProfileResponse> {
        val link = shareLinkStore[code]
            ?: return ResponseEntity.notFound().build()

        if (link.expiresAt != null && Instant.now().isAfter(link.expiresAt)) {
            return ResponseEntity.status(410).build()
        }

        // Increment view count
        shareLinkStore[code] = link.copy(viewCount = link.viewCount + 1)

        val userId = UserId(link.userId)
        val profile = profileRepository.findByUserId(userId)
            ?: return ResponseEntity.notFound().build()
        val user = userRepository.findById(userId)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(
            ShareProfileResponse(
                nickname = user.publicInfo.nickname,
                gender = user.publicInfo.gender.name,
                profile = ProfileResponse.from(profile),
                viewCount = link.viewCount + 1
            )
        )
    }

    companion object {
        private val shareLinkStore = ConcurrentHashMap<String, ShareLinkData>()
    }
}

data class ShareLinkData(
    val code: String,
    val userId: java.util.UUID,
    val viewCount: Int,
    val expiresAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    fun toResponse() = ShareLinkResponse(
        code = code,
        shareUrl = "http://localhost:3002/share/$code",
        viewCount = viewCount,
        expiresAt = expiresAt?.toString(),
        createdAt = createdAt.toString()
    )
}

data class CreateShareLinkRequest(
    val expiry: String = "unlimited" // "7d", "30d", "unlimited"
)

data class ShareLinkResponse(
    val code: String,
    val shareUrl: String,
    val viewCount: Int,
    val expiresAt: String?,
    val createdAt: String
)

data class ShareProfileResponse(
    val nickname: String,
    val gender: String,
    val profile: ProfileResponse,
    val viewCount: Int
)
