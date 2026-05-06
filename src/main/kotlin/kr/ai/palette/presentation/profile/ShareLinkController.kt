package kr.ai.palette.presentation.profile

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.persistence.sharelink.ShareLinkEntity
import kr.ai.palette.persistence.sharelink.ShareLinkJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/v1/share")
class ShareLinkController(
    private val profileRepository: ProfileRepository,
    private val userRepository: UserRepository,
    private val shareLinkJpaRepository: ShareLinkJpaRepository
) {

    @PostMapping("/link")
    @Transactional
    fun createShareLink(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: CreateShareLinkRequest
    ): ResponseEntity<ShareLinkResponse> {
        val expiresAt = when (request.expiry) {
            "7d" -> Instant.now().plusSeconds(7 * 24 * 3600)
            "30d" -> Instant.now().plusSeconds(30 * 24 * 3600)
            else -> null
        }

        val existing = shareLinkJpaRepository.findByUserId(authUser.userId.value)
        val entity = if (existing != null) {
            ShareLinkEntity(
                code = existing.code,
                userId = existing.userId,
                viewCount = existing.viewCount,
                expiresAt = expiresAt,
                createdAt = existing.createdAt,
                updatedAt = Instant.now()
            )
        } else {
            val code = UUID.randomUUID().toString().replace("-", "").take(8)
            ShareLinkEntity(
                code = code,
                userId = authUser.userId.value,
                expiresAt = expiresAt
            )
        }
        val saved = shareLinkJpaRepository.save(entity)
        return ResponseEntity.ok(saved.toResponse())
    }

    @GetMapping("/link/me")
    fun getMyShareLink(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<ShareLinkResponse> {
        val link = shareLinkJpaRepository.findByUserId(authUser.userId.value)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(link.toResponse())
    }

    @GetMapping("/{code}")
    @Transactional
    fun resolveShareLink(@PathVariable code: String): ResponseEntity<ShareProfileResponse> {
        val link = shareLinkJpaRepository.findById(code).orElse(null)
            ?: return ResponseEntity.notFound().build()

        if (link.expiresAt != null && Instant.now().isAfter(link.expiresAt)) {
            return ResponseEntity.status(410).build()
        }

        val updated = ShareLinkEntity(
            code = link.code,
            userId = link.userId,
            viewCount = link.viewCount + 1,
            expiresAt = link.expiresAt,
            createdAt = link.createdAt,
            updatedAt = Instant.now()
        )
        shareLinkJpaRepository.save(updated)

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
}

private fun ShareLinkEntity.toResponse() = ShareLinkResponse(
    code = code,
    shareUrl = "http://localhost:3002/share/$code",
    viewCount = viewCount,
    expiresAt = expiresAt?.toString(),
    createdAt = createdAt.toString()
)

data class CreateShareLinkRequest(
    val expiry: String = "unlimited"
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
