package kr.ai.palette.domain.profile

import kr.ai.palette.domain.common.UserId

interface ProfileRepository {
    fun save(profile: Profile): Profile
    fun findById(id: ProfileId): Profile?
    fun findByUserId(userId: UserId): Profile?
    fun existsByUserId(userId: UserId): Boolean
    fun delete(id: ProfileId)
}
