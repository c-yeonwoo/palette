package kr.ai.palette.infrastructure.config

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.*
import kr.ai.palette.domain.profile.*
import kr.ai.palette.domain.matchmaker.*
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.LocalDate
import java.util.*

@Component
class DataInitializer(
    private val userRepository: UserRepository,
    private val profileRepository: ProfileRepository,
    private val matchmakerRepository: MatchmakerRepository,
    private val passwordEncoder: PasswordEncoder
) : ApplicationRunner {

    override fun run(args: ApplicationArguments) {
        createTestUsers()
        createTestProfiles()
        createTestMatchmakers()
    }

    private val testUserIds = mutableMapOf<String, UserId>()

    private fun createTestUsers() {
        val now = Instant.now()

        // 일반 유저 1: 김민준 (남성, IT 개발자)
        val user1Id = UserId(UUID.randomUUID())
        testUserIds["minjun"] = user1Id
        val user1 = User(
            id = user1Id,
            oauthInfo = null,
            password = passwordEncoder.encode("test1234"),
            privateInfo = PrivateInfo(
                realName = "김민준",
                email = "minjun.kim@test.com",
                phoneNumber = "010-1234-5678"
            ),
            publicInfo = PublicInfo(
                nickname = "개발하는민준",
                birthDate = LocalDate.of(1995, 3, 15),
                gender = Gender.MALE
            ),
            accountType = AccountType.REGULAR,
            isProfileCompleted = true,
            termsAgreement = TermsAgreement(
                agreedTermsService = true,
                agreedTermsPrivacy = true,
                agreedMarketing = false,
                agreedAt = now
            ),
            metadata = UserMetadata(
                createdAt = now,
                updatedAt = now,
                lastLoginAt = now
            )
        )
        userRepository.save(user1)

        // 일반 유저 2: 이서연 (여성, 마케터)
        val user2Id = UserId(UUID.randomUUID())
        testUserIds["seoyeon"] = user2Id
        val user2 = User(
            id = user2Id,
            oauthInfo = null,
            password = passwordEncoder.encode("test1234"),
            privateInfo = PrivateInfo(
                realName = "이서연",
                email = "seoyeon.lee@test.com",
                phoneNumber = "010-2345-6789"
            ),
            publicInfo = PublicInfo(
                nickname = "마케팅서연",
                birthDate = LocalDate.of(1997, 7, 22),
                gender = Gender.FEMALE
            ),
            accountType = AccountType.REGULAR,
            isProfileCompleted = true,
            termsAgreement = TermsAgreement(
                agreedTermsService = true,
                agreedTermsPrivacy = true,
                agreedMarketing = true,
                agreedAt = now
            ),
            metadata = UserMetadata(
                createdAt = now,
                updatedAt = now,
                lastLoginAt = now
            )
        )
        userRepository.save(user2)

        // 일반 유저 3: 박지훈 (남성, 금융)
        val user3Id = UserId(UUID.randomUUID())
        testUserIds["jihoon"] = user3Id
        val user3 = User(
            id = user3Id,
            oauthInfo = null,
            password = passwordEncoder.encode("test1234"),
            privateInfo = PrivateInfo(
                realName = "박지훈",
                email = "jihoon.park@test.com",
                phoneNumber = "010-3456-7890"
            ),
            publicInfo = PublicInfo(
                nickname = "금융맨지훈",
                birthDate = LocalDate.of(1993, 11, 8),
                gender = Gender.MALE
            ),
            accountType = AccountType.REGULAR,
            isProfileCompleted = true,
            termsAgreement = TermsAgreement(
                agreedTermsService = true,
                agreedTermsPrivacy = true,
                agreedMarketing = false,
                agreedAt = now
            ),
            metadata = UserMetadata(
                createdAt = now,
                updatedAt = now,
                lastLoginAt = now
            )
        )
        userRepository.save(user3)

        // 일반 유저 4: 최유진 (여성, 교육)
        val user4Id = UserId(UUID.randomUUID())
        testUserIds["yujin"] = user4Id
        val user4 = User(
            id = user4Id,
            oauthInfo = null,
            password = passwordEncoder.encode("test1234"),
            privateInfo = PrivateInfo(
                realName = "최유진",
                email = "yujin.choi@test.com",
                phoneNumber = "010-4567-8901"
            ),
            publicInfo = PublicInfo(
                nickname = "선생님유진",
                birthDate = LocalDate.of(1996, 5, 30),
                gender = Gender.FEMALE
            ),
            accountType = AccountType.REGULAR,
            isProfileCompleted = true,
            termsAgreement = TermsAgreement(
                agreedTermsService = true,
                agreedTermsPrivacy = true,
                agreedMarketing = true,
                agreedAt = now
            ),
            metadata = UserMetadata(
                createdAt = now,
                updatedAt = now,
                lastLoginAt = now
            )
        )
        userRepository.save(user4)

        // 일반 유저 5: 정도현 (남성, 의료)
        val user5Id = UserId(UUID.randomUUID())
        testUserIds["dohyun"] = user5Id
        val user5 = User(
            id = user5Id,
            oauthInfo = null,
            password = passwordEncoder.encode("test1234"),
            privateInfo = PrivateInfo(
                realName = "정도현",
                email = "dohyun.jung@test.com",
                phoneNumber = "010-5678-9012"
            ),
            publicInfo = PublicInfo(
                nickname = "의사도현",
                birthDate = LocalDate.of(1992, 9, 12),
                gender = Gender.MALE
            ),
            accountType = AccountType.REGULAR,
            isProfileCompleted = true,
            termsAgreement = TermsAgreement(
                agreedTermsService = true,
                agreedTermsPrivacy = true,
                agreedMarketing = false,
                agreedAt = now
            ),
            metadata = UserMetadata(
                createdAt = now,
                updatedAt = now,
                lastLoginAt = now
            )
        )
        userRepository.save(user5)

        // 주선자 전용 1: 강혜원 (여성)
        val matchmaker1Id = UserId(UUID.randomUUID())
        testUserIds["hyewon"] = matchmaker1Id
        val matchmaker1 = User(
            id = matchmaker1Id,
            oauthInfo = null,
            password = passwordEncoder.encode("test1234"),
            privateInfo = PrivateInfo(
                realName = "강혜원",
                email = "hyewon.kang@test.com",
                phoneNumber = "010-6789-0123"
            ),
            publicInfo = PublicInfo(
                nickname = "큐피드혜원",
                birthDate = LocalDate.of(1990, 4, 18),
                gender = Gender.FEMALE
            ),
            accountType = AccountType.MATCHMAKER_ONLY,
            isProfileCompleted = true,
            termsAgreement = TermsAgreement(
                agreedTermsService = true,
                agreedTermsPrivacy = true,
                agreedMarketing = true,
                agreedAt = now
            ),
            metadata = UserMetadata(
                createdAt = now,
                updatedAt = now,
                lastLoginAt = now
            )
        )
        userRepository.save(matchmaker1)

        // 주선자 전용 2: 윤상호 (남성)
        val matchmaker2Id = UserId(UUID.randomUUID())
        testUserIds["sangho"] = matchmaker2Id
        val matchmaker2 = User(
            id = matchmaker2Id,
            oauthInfo = null,
            password = passwordEncoder.encode("test1234"),
            privateInfo = PrivateInfo(
                realName = "윤상호",
                email = "sangho.yoon@test.com",
                phoneNumber = "010-7890-1234"
            ),
            publicInfo = PublicInfo(
                nickname = "중매쟁이상호",
                birthDate = LocalDate.of(1988, 12, 25),
                gender = Gender.MALE
            ),
            accountType = AccountType.MATCHMAKER_ONLY,
            isProfileCompleted = true,
            termsAgreement = TermsAgreement(
                agreedTermsService = true,
                agreedTermsPrivacy = true,
                agreedMarketing = false,
                agreedAt = now
            ),
            metadata = UserMetadata(
                createdAt = now,
                updatedAt = now,
                lastLoginAt = now
            )
        )
        userRepository.save(matchmaker2)

        println("✅ Mock data initialized successfully!")
        println("📝 Created 5 REGULAR users and 2 MATCHMAKER_ONLY users")
        println("🔑 Test accounts (email/password):")
        println("   - REGULAR: minjun.kim@test.com / test1234")
        println("   - REGULAR: seoyeon.lee@test.com / test1234")
        println("   - REGULAR: jihoon.park@test.com / test1234")
        println("   - REGULAR: yujin.choi@test.com / test1234")
        println("   - REGULAR: dohyun.jung@test.com / test1234")
        println("   - MATCHMAKER: hyewon.kang@test.com / test1234")
        println("   - MATCHMAKER: sangho.yoon@test.com / test1234")
    }

    private fun createTestProfiles() {
        val now = Instant.now()

        // Profile 1: 김민준 (남성, IT 개발자)
        val profile1 = Profile(
            id = ProfileId(UUID.randomUUID()),
            userId = testUserIds["minjun"]!!,
            basicInfo = BasicInfo(
                height = 178,
                bodyType = BodyType.ATHLETIC
            ),
            careerInfo = CareerInfo(
                category = CareerCategory.IT_DEVELOPMENT,
                company = "네이버",
                position = "시니어 개발자"
            ),
            educationInfo = EducationInfo(
                level = EducationLevel.BACHELOR,
                school = "서울대학교",
                major = "컴퓨터공학"
            ),
            locationInfo = LocationInfo(
                sido = "서울",
                sigungu = "강남구",
                hometownSido = "서울",
                hometownSigungu = "강남구"
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = Frequency.NEVER,
                drinking = Frequency.SOMETIMES,
                religion = Religion.NONE
            ),
            introduction = Introduction(
                text = "안녕하세요! 개발을 좋아하고 새로운 기술에 관심이 많습니다. 주말에는 등산이나 카페에서 책 읽는 것을 좋아합니다.",
                interests = listOf("개발", "등산", "독서", "영화감상")
            ),
            idealType = IdealType(
                datePreferences = listOf(DatePreference.ACTIVE, DatePreference.CULTURE),
                importantValues = listOf(ImportantValue.PERSONALITY, ImportantValue.CAREER, ImportantValue.VALUES),
                personalities = listOf("밝은", "유머러스한", "지적인"),
                appearanceStyles = listOf("CAT"), // 남성 유저 -> 여자 스타일 (하나만 선택)
                dealBreakers = listOf(DealBreaker.SMOKING, DealBreaker.CONTACTS_EX)
            ),
            photos = emptyList(),
            videos = emptyList(),
            metadata = ProfileMetadata(
                createdAt = now,
                updatedAt = now,
                lastAccessedAt = now,
                deletedAt = null
            ),
            metrics = ProfileMetrics(
                completionRate = 85,
                trustScore = 0,
                viewCount = 0
            ),
            settings = ProfileSettings.initial()
        )
        profileRepository.save(profile1)

        // Profile 2: 이서연 (여성, 마케터)
        val profile2 = Profile(
            id = ProfileId(UUID.randomUUID()),
            userId = testUserIds["seoyeon"]!!,
            basicInfo = BasicInfo(
                height = 165,
                bodyType = BodyType.SLIM
            ),
            careerInfo = CareerInfo(
                category = CareerCategory.MEDIA,
                company = "카카오",
                position = "마케팅 매니저"
            ),
            educationInfo = EducationInfo(
                level = EducationLevel.BACHELOR,
                school = "연세대학교",
                major = "경영학"
            ),
            locationInfo = LocationInfo(
                sido = "서울",
                sigungu = "강남구",
                hometownSido = "경기",
                hometownSigungu = "수원시"
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = Frequency.NEVER,
                drinking = Frequency.OFTEN,
                religion = Religion.CHRISTIANITY
            ),
            introduction = Introduction(
                text = "활발하고 긍정적인 성격입니다. 새로운 사람들과 만나는 것을 좋아하고, 여행과 맛집 탐방을 즐깁니다!",
                interests = listOf("여행", "맛집", "요가", "사진", "전시회")
            ),
            idealType = IdealType(
                datePreferences = listOf(DatePreference.ACTIVE, DatePreference.NATURE),
                importantValues = listOf(ImportantValue.PERSONALITY, ImportantValue.CAREER, ImportantValue.APPEARANCE),
                personalities = listOf("유머러스한", "배려심있는", "적극적인"),
                appearanceStyles = listOf("STUDENT_COUNCIL"), // 여성 유저 -> 남자 스타일 (하나만 선택)
                dealBreakers = listOf(DealBreaker.SMOKING, DealBreaker.UNSTABLE_JOB)
            ),
            photos = emptyList(),
            videos = emptyList(),
            metadata = ProfileMetadata(
                createdAt = now,
                updatedAt = now,
                lastAccessedAt = now,
                deletedAt = null
            ),
            metrics = ProfileMetrics(
                completionRate = 90,
                trustScore = 0,
                viewCount = 0
            ),
            settings = ProfileSettings.initial()
        )
        profileRepository.save(profile2)

        // Profile 3: 박지훈 (남성, 금융)
        val profile3 = Profile(
            id = ProfileId(UUID.randomUUID()),
            userId = testUserIds["jihoon"]!!,
            basicInfo = BasicInfo(
                height = 180,
                bodyType = BodyType.MUSCULAR
            ),
            careerInfo = CareerInfo(
                category = CareerCategory.FINANCE,
                company = "삼성증권",
                position = "자산관리사"
            ),
            educationInfo = EducationInfo(
                level = EducationLevel.MASTER,
                school = "고려대학교",
                major = "경제학"
            ),
            locationInfo = LocationInfo(
                sido = "서울",
                sigungu = "영등포구",
                hometownSido = "부산",
                hometownSigungu = "해운대구"
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = Frequency.NEVER,
                drinking = Frequency.SOMETIMES,
                religion = Religion.NONE
            ),
            introduction = Introduction(
                text = "운동을 좋아하고 건강한 라이프스타일을 추구합니다. 진지하고 책임감 있는 관계를 원합니다.",
                interests = listOf("헬스", "골프", "경제", "와인")
            ),
            idealType = IdealType(
                datePreferences = listOf(DatePreference.CULTURE, DatePreference.INDOOR),
                importantValues = listOf(ImportantValue.PERSONALITY, ImportantValue.FAMILY, ImportantValue.VALUES),
                personalities = listOf("차분한", "이해심있는", "따뜻한"),
                appearanceStyles = listOf("DEER"), // 남성 유저 -> 여자 스타일 (하나만 선택)
                dealBreakers = listOf(DealBreaker.SMOKING, DealBreaker.HEAVY_DRINKING, DealBreaker.CONTACTS_EX)
            ),
            photos = emptyList(),
            videos = emptyList(),
            metadata = ProfileMetadata(
                createdAt = now,
                updatedAt = now,
                lastAccessedAt = now,
                deletedAt = null
            ),
            metrics = ProfileMetrics(
                completionRate = 88,
                trustScore = 0,
                viewCount = 0
            ),
            settings = ProfileSettings.initial()
        )
        profileRepository.save(profile3)

        // Profile 4: 최유진 (여성, 교육)
        val profile4 = Profile(
            id = ProfileId(UUID.randomUUID()),
            userId = testUserIds["yujin"]!!,
            basicInfo = BasicInfo(
                height = 162,
                bodyType = BodyType.AVERAGE
            ),
            careerInfo = CareerInfo(
                category = CareerCategory.EDUCATION,
                company = "서울시립초등학교",
                position = "초등교사"
            ),
            educationInfo = EducationInfo(
                level = EducationLevel.BACHELOR,
                school = "이화여자대학교",
                major = "초등교육"
            ),
            locationInfo = LocationInfo(
                sido = "서울",
                sigungu = "송파구",
                hometownSido = "서울",
                hometownSigungu = "강동구"
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = Frequency.NEVER,
                drinking = Frequency.SOMETIMES,
                religion = Religion.CATHOLICISM
            ),
            introduction = Introduction(
                text = "아이들을 가르치는 일이 정말 즐겁습니다. 따뜻하고 진실된 관계를 추구합니다. 음악과 예술을 사랑합니다.",
                interests = listOf("피아노", "독서", "영화", "베이킹", "그림")
            ),
            idealType = IdealType(
                datePreferences = listOf(DatePreference.INDOOR, DatePreference.CULTURE),
                importantValues = listOf(ImportantValue.PERSONALITY, ImportantValue.FAMILY, ImportantValue.JOB),
                personalities = listOf("따뜻한", "책임감있는", "가정적인"),
                appearanceStyles = listOf("TOFU"), // 여성 유저 -> 남자 스타일 (하나만 선택)
                dealBreakers = listOf(DealBreaker.SMOKING, DealBreaker.HEAVY_DRINKING)
            ),
            photos = emptyList(),
            videos = emptyList(),
            metadata = ProfileMetadata(
                createdAt = now,
                updatedAt = now,
                lastAccessedAt = now,
                deletedAt = null
            ),
            metrics = ProfileMetrics(
                completionRate = 92,
                trustScore = 0,
                viewCount = 0
            ),
            settings = ProfileSettings.initial()
        )
        profileRepository.save(profile4)

        // Profile 5: 정도현 (남성, 의료)
        val profile5 = Profile(
            id = ProfileId(UUID.randomUUID()),
            userId = testUserIds["dohyun"]!!,
            basicInfo = BasicInfo(
                height = 175,
                bodyType = BodyType.AVERAGE
            ),
            careerInfo = CareerInfo(
                category = CareerCategory.MEDICAL,
                company = "서울대학교병원",
                position = "내과 전문의"
            ),
            educationInfo = EducationInfo(
                level = EducationLevel.DOCTORATE,
                school = "서울대학교",
                major = "의학"
            ),
            locationInfo = LocationInfo(
                sido = "서울",
                sigungu = "종로구",
                hometownSido = "대전",
                hometownSigungu = "유성구"
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = Frequency.NEVER,
                drinking = Frequency.NEVER,
                religion = Religion.BUDDHISM
            ),
            introduction = Introduction(
                text = "환자를 돌보는 일에 보람을 느낍니다. 바쁘지만 시간 관리를 잘하려고 노력합니다. 조용하고 차분한 성격입니다.",
                interests = listOf("명상", "클래식", "독서", "산책")
            ),
            idealType = IdealType(
                datePreferences = listOf(DatePreference.CULTURE, DatePreference.NATURE),
                importantValues = listOf(ImportantValue.PERSONALITY, ImportantValue.VALUES, ImportantValue.EDUCATION),
                personalities = listOf("차분한", "이해심있는", "지적인"),
                appearanceStyles = listOf("CAT"), // 남성 유저 -> 여자 스타일 (하나만 선택)
                dealBreakers = listOf(DealBreaker.SMOKING, DealBreaker.HEAVY_DRINKING)
            ),
            photos = emptyList(),
            videos = emptyList(),
            metadata = ProfileMetadata(
                createdAt = now,
                updatedAt = now,
                lastAccessedAt = now,
                deletedAt = null
            ),
            metrics = ProfileMetrics(
                completionRate = 87,
                trustScore = 0,
                viewCount = 0
            ),
            settings = ProfileSettings.initial()
        )
        profileRepository.save(profile5)

        println("✅ Profile mock data initialized successfully!")
        println("📊 Created 5 profiles for REGULAR users")
    }

    private fun createTestMatchmakers() {
        val now = Instant.now()

        // REGULAR 계정들에 주선자 데이터 생성 (낮은 레벨)
        // Matchmaker for 김민준
        val matchmakerMinjun = Matchmaker(
            id = MatchmakerId(UUID.randomUUID()),
            userId = testUserIds["minjun"]!!,
            stats = MatchmakerStats.initial(),
            level = MatchmakerLevel.initial(),
            earnings = MatchmakerEarnings.initial(),
            profilePhoto = null,
            metadata = MatchmakerMetadata(
                createdAt = now,
                updatedAt = now
            )
        )
        matchmakerRepository.save(matchmakerMinjun)

        // Matchmaker for 이서연
        val matchmakerSeoyeon = Matchmaker(
            id = MatchmakerId(UUID.randomUUID()),
            userId = testUserIds["seoyeon"]!!,
            stats = MatchmakerStats(
                totalMatchRequests = 3,
                approvedRequests = 2,
                rejectedRequests = 1,
                successfulMatches = 1,
                failedMatches = 1
            ),
            level = MatchmakerLevel(
                level = 1,
                commissionRate = 0.05
            ),
            earnings = MatchmakerEarnings(
                totalPoints = 2000,
                withdrawnPoints = 0,
                pendingPoints = 0
            ),
            profilePhoto = null,
            metadata = MatchmakerMetadata(
                createdAt = now,
                updatedAt = now
            )
        )
        matchmakerRepository.save(matchmakerSeoyeon)

        // Matchmaker for 박지훈
        val matchmakerJihoon = Matchmaker(
            id = MatchmakerId(UUID.randomUUID()),
            userId = testUserIds["jihoon"]!!,
            stats = MatchmakerStats(
                totalMatchRequests = 5,
                approvedRequests = 4,
                rejectedRequests = 1,
                successfulMatches = 3,
                failedMatches = 1
            ),
            level = MatchmakerLevel(
                level = 1,
                commissionRate = 0.05
            ),
            earnings = MatchmakerEarnings(
                totalPoints = 5500,
                withdrawnPoints = 0,
                pendingPoints = 0
            ),
            profilePhoto = null,
            metadata = MatchmakerMetadata(
                createdAt = now,
                updatedAt = now
            )
        )
        matchmakerRepository.save(matchmakerJihoon)

        // Matchmaker for 최유진
        val matchmakerYujin = Matchmaker(
            id = MatchmakerId(UUID.randomUUID()),
            userId = testUserIds["yujin"]!!,
            stats = MatchmakerStats.initial(),
            level = MatchmakerLevel.initial(),
            earnings = MatchmakerEarnings.initial(),
            profilePhoto = null,
            metadata = MatchmakerMetadata(
                createdAt = now,
                updatedAt = now
            )
        )
        matchmakerRepository.save(matchmakerYujin)

        // Matchmaker for 정도현
        val matchmakerDohyun = Matchmaker(
            id = MatchmakerId(UUID.randomUUID()),
            userId = testUserIds["dohyun"]!!,
            stats = MatchmakerStats(
                totalMatchRequests = 2,
                approvedRequests = 2,
                rejectedRequests = 0,
                successfulMatches = 1,
                failedMatches = 1
            ),
            level = MatchmakerLevel(
                level = 1,
                commissionRate = 0.05
            ),
            earnings = MatchmakerEarnings(
                totalPoints = 2500,
                withdrawnPoints = 0,
                pendingPoints = 0
            ),
            profilePhoto = null,
            metadata = MatchmakerMetadata(
                createdAt = now,
                updatedAt = now
            )
        )
        matchmakerRepository.save(matchmakerDohyun)

        // MATCHMAKER_ONLY 계정들에 주선자 데이터 생성 (높은 레벨)
        // Matchmaker 1: 강혜원
        val matchmaker1 = Matchmaker(
            id = MatchmakerId(UUID.randomUUID()),
            userId = testUserIds["hyewon"]!!,
            stats = MatchmakerStats(
                totalMatchRequests = 25,
                approvedRequests = 20,
                rejectedRequests = 5,
                successfulMatches = 15,
                failedMatches = 5
            ),
            level = MatchmakerLevel(
                level = 3,
                commissionRate = 0.15
            ),
            earnings = MatchmakerEarnings(
                totalPoints = 45000,
                withdrawnPoints = 10000,
                pendingPoints = 0
            ),
            profilePhoto = null,
            metadata = MatchmakerMetadata(
                createdAt = now,
                updatedAt = now
            )
        )
        matchmakerRepository.save(matchmaker1)

        // Matchmaker 2: 윤상호
        val matchmaker2 = Matchmaker(
            id = MatchmakerId(UUID.randomUUID()),
            userId = testUserIds["sangho"]!!,
            stats = MatchmakerStats(
                totalMatchRequests = 18,
                approvedRequests = 15,
                rejectedRequests = 3,
                successfulMatches = 12,
                failedMatches = 3
            ),
            level = MatchmakerLevel(
                level = 2,
                commissionRate = 0.10
            ),
            earnings = MatchmakerEarnings(
                totalPoints = 32000,
                withdrawnPoints = 5000,
                pendingPoints = 2000
            ),
            profilePhoto = null,
            metadata = MatchmakerMetadata(
                createdAt = now,
                updatedAt = now
            )
        )
        matchmakerRepository.save(matchmaker2)

        println("✅ Matchmaker mock data initialized successfully!")
        println("📊 Created 7 matchmakers (5 REGULAR + 2 MATCHMAKER_ONLY users)")
    }
}
