package kr.ai.palette.presentation.profile

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.storage.FileStorageService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/v1")
class PublicProfileController(
    private val profileRepository: ProfileRepository,
    private val userRepository: UserRepository,
    private val fileStorageService: FileStorageService,
) {

    @GetMapping("/profile/public/{userId}")
    fun getPublicProfile(@PathVariable userId: String): ResponseEntity<ProfileResponse> {
        val profile = profileRepository.findByUserId(UserId(UUID.fromString(userId)))
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(ProfileResponse.from(profile, fileStorageService))
    }

    @GetMapping("/users/{userId}/public")
    fun getPublicUser(@PathVariable userId: String): ResponseEntity<PublicUserResponse> {
        val user = userRepository.findById(UserId(UUID.fromString(userId)))
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(
            PublicUserResponse(
                nickname = user.publicInfo.nickname,
                gender = user.publicInfo.gender.name
            )
        )
    }
}

data class PublicUserResponse(
    val nickname: String,
    val gender: String
)
