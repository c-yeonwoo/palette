package kr.ai.palette.palettepick

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import kr.ai.palette.application.safety.BlockService
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.profile.LocationInfo
import kr.ai.palette.domain.profile.Profile
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.AccountType
import kr.ai.palette.domain.user.Gender
import kr.ai.palette.domain.user.PrivateInfo
import kr.ai.palette.domain.user.PublicInfo
import kr.ai.palette.domain.user.TermsAgreement
import kr.ai.palette.domain.user.User
import kr.ai.palette.domain.user.UserMetadata
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.seed.SeedUserPolicy
import kr.ai.palette.palettepick.application.CandidatePoolService
import kr.ai.palette.palettepick.application.CandidateSource
import kr.ai.palette.persistence.feed.FeedHideJpaRepository
import kr.ai.palette.persistence.profile.ProfileJpaRepository
import kr.ai.palette.persistence.profile.PublicPoolCandidateRow
import kr.ai.palette.persistence.recommendation.AdminBlockedTargetJpaRepository
import kr.ai.palette.persistence.recommendation.DailyRecommendationJpaRepository
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * 콜드스타트 공개 발견 폴백 (ADR 0072) — 친구 0명 viewer 가 수도권 공개 풀을
 * 거리순으로 받고, 이성·활성·시드 필터가 걸리는지 결정적으로 검증.
 *
 * UserId 는 value class 라 mockk 로 stub 불가 → viewer 는 실제 User 로 생성.
 */
class CandidatePoolColdStartTest : DescribeSpec({

    fun row(id: UUID, sido: String, sigungu: String) = object : PublicPoolCandidateRow {
        override val userId = id
        override val sido: String? = sido
        override val sigungu: String? = sigungu
    }

    fun candidateUser(gender: Gender = Gender.FEMALE, active: Boolean = true): User {
        val pub = mockk<PublicInfo>()
        every { pub.gender } returns gender
        return mockk {
            every { isActive() } returns active
            every { publicInfo } returns pub
        }
    }

    describe("CandidatePoolService — 콜드스타트 공개 폴백") {

        val friendship = mockk<FriendshipRepository>()
        val profileRepo = mockk<ProfileRepository>()
        val userRepo = mockk<UserRepository>()
        val feedHide = mockk<FeedHideJpaRepository>()
        val dailyRec = mockk<DailyRecommendationJpaRepository>()
        val adminBlocked = mockk<AdminBlockedTargetJpaRepository>()
        val block = mockk<BlockService>()
        val profileJpa = mockk<ProfileJpaRepository>()
        val seed = mockk<SeedUserPolicy>()

        val now = Instant.now()
        val viewerUuid = UUID.randomUUID()
        val viewer = User(
            id = UserId(viewerUuid),
            oauthInfo = null,
            password = "x",
            privateInfo = PrivateInfo("뷰어", "viewer@example.com", "010-0000-0000", true, null),
            publicInfo = PublicInfo(nickname = "뷰어", birthDate = LocalDate.of(1995, 1, 1), gender = Gender.MALE),
            accountType = AccountType.REGULAR,
            isProfileCompleted = true,
            termsAgreement = TermsAgreement(true, true, false, now),
            metadata = UserMetadata(now, now, now, null),
        )
        val viewerId = UserId(viewerUuid)

        // 친구 0명 (콜드스타트) → 지인 티어 비어 공개 폴백 발동
        every { friendship.findFriendIdsByUserId(viewerId) } returns emptyList()
        every { friendship.findSecondDegreeFriendIds(viewerId) } returns emptyList()
        every { feedHide.findAllByUserId(any()) } returns emptyList()
        every { dailyRec.findRecentlyRecommendedTargetIds(any(), any()) } returns emptyList()
        every { adminBlocked.findActiveBlockedTargetIds(any(), any()) } returns emptyList()
        every { block.blockedCounterpartIds(viewerUuid) } returns emptySet()
        // viewer 위치 = 서울 강남구 (거리 원점)
        every { profileRepo.findByUserId(viewerId) } returns mockk<Profile> {
            every { locationInfo } returns LocationInfo("서울", "강남구")
        }
        every { seed.isSeed(any<User>()) } returns false

        val service = CandidatePoolService(
            friendship, profileRepo, userRepo, feedHide, dailyRec, adminBlocked, block, profileJpa, seed,
        )

        it("친구 0명이면 수도권 공개 풀을 거리순으로 반환 (강남 → 송파 → 수원)") {
            val gangnam = UUID.randomUUID()   // 서울 강남구 (0km)
            val songpa = UUID.randomUUID()    // 서울 송파구 (~7km)
            val suwon = UUID.randomUUID()     // 경기 수원시 (~30km)
            // 쿼리는 정렬 안 된 채로 반환 — 서비스가 거리순 정렬해야 함
            every { profileJpa.findPublicPoolCandidates(any()) } returns listOf(
                row(suwon, "경기", "수원시"),
                row(gangnam, "서울", "강남구"),
                row(songpa, "서울", "송파구"),
            )
            every { userRepo.findById(UserId(gangnam)) } returns candidateUser()
            every { userRepo.findById(UserId(songpa)) } returns candidateUser()
            every { userRepo.findById(UserId(suwon)) } returns candidateUser()

            val result = service.buildWithMeta(viewer)

            result.map { it.userId } shouldContainExactly listOf(gangnam, songpa, suwon)
            result.all { it.source == CandidateSource.PUBLIC } shouldBe true
            result.first().distanceKm!! shouldBe 0.0
        }

        it("동성·비활성·시드 후보는 공개 풀에서 제외") {
            val female = UUID.randomUUID()
            val male = UUID.randomUUID()
            val inactive = UUID.randomUUID()
            val seedUuid = UUID.randomUUID()
            every { profileJpa.findPublicPoolCandidates(any()) } returns listOf(
                row(female, "서울", "강남구"),
                row(male, "서울", "강남구"),
                row(inactive, "서울", "강남구"),
                row(seedUuid, "서울", "강남구"),
            )
            every { userRepo.findById(UserId(female)) } returns candidateUser()
            every { userRepo.findById(UserId(male)) } returns candidateUser(gender = Gender.MALE)
            every { userRepo.findById(UserId(inactive)) } returns candidateUser(active = false)
            val seedFemale = candidateUser()
            every { userRepo.findById(UserId(seedUuid)) } returns seedFemale
            every { seed.isSeed(seedFemale) } returns true  // 비시드 viewer → 시드 후보 제외

            val result = service.buildWithMeta(viewer)

            result.map { it.userId } shouldContainExactly listOf(female)
        }
    }
})
