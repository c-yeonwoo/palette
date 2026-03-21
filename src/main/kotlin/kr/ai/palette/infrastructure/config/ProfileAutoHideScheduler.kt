package kr.ai.palette.infrastructure.config

import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.profile.ProfileSettings
import kr.ai.palette.domain.user.UserRepository
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * 30일 미접속 시 프로필 자동 숨김 처리
 */
@Component
class ProfileAutoHideScheduler(
    private val profileRepository: ProfileRepository,
    private val userRepository: UserRepository
) {

    /**
     * 매일 새벽 3시에 실행
     * 30일 이상 미접속 유저의 프로필을 자동으로 숨김
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    fun autoHideInactiveProfiles() {
        val cutoffDate = Instant.now().minus(30, ChronoUnit.DAYS)

        val profiles = profileRepository.findAll()
        var hiddenCount = 0

        profiles.forEach { profile ->
            // Skip already hidden profiles
            if (profile.settings.hiddenAt != null) return@forEach

            // Check last login via user
            val user = userRepository.findById(profile.userId) ?: return@forEach
            val lastLogin = user.metadata.lastLoginAt

            if (lastLogin.isBefore(cutoffDate)) {
                val updatedProfile = profile.updateSettings(
                    ProfileSettings(
                        isAcceptingMatches = false,
                        hiddenAt = Instant.now()
                    )
                )
                profileRepository.save(updatedProfile)
                hiddenCount++
            }
        }

        if (hiddenCount > 0) {
            println("Auto-hidden $hiddenCount inactive profiles")
        }
    }
}
