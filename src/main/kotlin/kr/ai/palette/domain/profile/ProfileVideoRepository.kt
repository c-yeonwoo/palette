package kr.ai.palette.domain.profile

interface ProfileVideoRepository {
    fun save(video: ProfileVideo): ProfileVideo
    fun findById(id: ProfileVideoId): ProfileVideo?
    fun findByProfileId(profileId: ProfileId): ProfileVideo?
    fun delete(id: ProfileVideoId)
    fun deleteByProfileId(profileId: ProfileId)
}
