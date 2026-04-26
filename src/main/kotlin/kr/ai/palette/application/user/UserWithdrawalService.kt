package kr.ai.palette.application.user

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.persistence.feed.CardOpenJpaRepository
import kr.ai.palette.persistence.friendship.FriendshipJpaRepository
import kr.ai.palette.persistence.matchmaker.MatchmakerJpaRepository
import kr.ai.palette.persistence.matchmaking.MatchmakingRequestJpaRepository
import kr.ai.palette.persistence.notification.NotificationJpaRepository
import kr.ai.palette.persistence.profile.ProfileJpaRepository
import kr.ai.palette.persistence.profile.ProfilePhotoJpaRepository
import kr.ai.palette.persistence.profile.ProfileVideoJpaRepository
import kr.ai.palette.persistence.user.UserJpaRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserWithdrawalService(
    private val userJpaRepository: UserJpaRepository,
    private val profileJpaRepository: ProfileJpaRepository,
    private val profilePhotoJpaRepository: ProfilePhotoJpaRepository,
    private val profileVideoJpaRepository: ProfileVideoJpaRepository,
    private val matchmakerJpaRepository: MatchmakerJpaRepository,
    private val matchmakingRequestJpaRepository: MatchmakingRequestJpaRepository,
    private val friendshipJpaRepository: FriendshipJpaRepository,
    private val notificationJpaRepository: NotificationJpaRepository,
    private val cardOpenJpaRepository: CardOpenJpaRepository,
) {

    @Transactional
    fun withdraw(userId: UserId) {
        val id = userId.value

        // 1. 프로필 사진/동영상 (profile_id 기반)
        profileJpaRepository.findByUserId(id)?.let { profile ->
            profilePhotoJpaRepository.deleteByProfileId(profile.id)
            profileVideoJpaRepository.deleteByProfileId(profile.id)
            profileJpaRepository.deleteById(profile.id)
        }

        // 2. 주선자 레코드
        matchmakerJpaRepository.findByUserId(id)?.let {
            matchmakerJpaRepository.deleteById(it.id)
        }

        // 3. 매칭 요청 (requester / target / matchmaker 모두)
        matchmakingRequestJpaRepository.deleteByRequesterId(id)
        matchmakingRequestJpaRepository.deleteByTargetUserId(id)
        matchmakingRequestJpaRepository.deleteByMatchmakerId(id)

        // 4. 친구 관계
        friendshipJpaRepository.deleteByUserId(id)

        // 5. 알림
        notificationJpaRepository.deleteByUserId(id.toString())

        // 6. 카드 열람 기록
        cardOpenJpaRepository.deleteByViewerId(id)
        cardOpenJpaRepository.deleteByTargetUserId(id)

        // 7. 유저 (마지막)
        userJpaRepository.deleteById(id)
    }
}
