package kr.ai.palette.presentation.notification

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.persistence.device.DeviceTokenEntity
import kr.ai.palette.persistence.device.DeviceTokenJpaRepository
import kr.ai.palette.persistence.device.DevicePlatform
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant

data class RegisterDeviceTokenRequest(
    val token: String,
    val platform: DevicePlatform
)

@RestController
@RequestMapping("/api/v1/devices")
class DeviceTokenController(
    private val deviceTokenRepository: DeviceTokenJpaRepository
) {

    @PostMapping("/token")
    @Transactional
    fun registerToken(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: RegisterDeviceTokenRequest
    ): ResponseEntity<Unit> {
        val userId = authUser.userId.value.toString()
        val existing = deviceTokenRepository.findByToken(request.token)

        if (existing != null) {
            // 토큰 소유자 변경 (재설치 등)
            if (existing.userId != userId) {
                deviceTokenRepository.deleteByToken(request.token)
                deviceTokenRepository.save(
                    DeviceTokenEntity(
                        userId = userId,
                        token = request.token,
                        platform = request.platform
                    )
                )
            }
        } else {
            deviceTokenRepository.save(
                DeviceTokenEntity(
                    userId = userId,
                    token = request.token,
                    platform = request.platform
                )
            )
        }

        return ResponseEntity.ok().build()
    }

    @DeleteMapping("/token")
    @Transactional
    fun unregisterToken(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: UnregisterDeviceTokenRequest
    ): ResponseEntity<Unit> {
        deviceTokenRepository.deleteByToken(request.token)
        return ResponseEntity.ok().build()
    }
}

data class UnregisterDeviceTokenRequest(val token: String)
