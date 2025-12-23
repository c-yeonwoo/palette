package kr.ai.palette.domain.profile

interface ProfilePhotoRepository {
    fun save(photo: ProfilePhoto): ProfilePhoto
    fun findById(id: ProfilePhotoId): ProfilePhoto?
    fun findByProfileId(profileId: ProfileId): List<ProfilePhoto>
    fun findPrimaryByProfileId(profileId: ProfileId): ProfilePhoto?
    fun delete(id: ProfilePhotoId)
    fun deleteByProfileId(profileId: ProfileId)
}
