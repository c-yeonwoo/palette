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
                sigungu = "강남구"
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = Frequency.NEVER,
                drinking = Frequency.SOMETIMES,
                religion = Religion.NONE
            ),
            introduction = Introduction(
                text = null,
                interests = listOf("개발", "등산", "독서", "영화감상"),
                interviewAnswers = InterviewAnswers(
                    hobby = "주말에는 등산을 가거나 카페에서 책을 읽으면서 여유롭게 시간을 보내요. 가끔은 친구들과 코딩 스터디를 하면서 새로운 기술을 배우기도 합니다.",
                    charm = "긍정적이고 문제 해결에 집중하는 성격이에요. 주변 사람들이 어려운 일이 있을 때 함께 고민해주는 편이라 든든하다는 말을 자주 듣습니다.",
                    passion = "요즘 클라우드 기술과 AI에 관심이 많아서 틈틈이 공부하고 있어요. 새로운 기술로 실제 서비스를 만들어보는 게 즐거워요.",
                    happiness = "새로운 기술로 무언가를 구현해냈을 때, 그리고 좋아하는 사람들과 함께 맛있는 음식을 먹으면서 이야기 나눌 때 행복합니다.",
                    motto = "꾸준함이 천재를 이긴다는 말을 믿어요. 매일 조금씩이라도 성장하려고 노력하는 편입니다."
                )
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
                completionRate = 0,
                trustScore = 0,
                viewCount = 0
            ),
            settings = ProfileSettings.initial()
        ).recalculateMetrics()
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
                sigungu = "강남구"
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = Frequency.NEVER,
                drinking = Frequency.OFTEN,
                religion = Religion.CHRISTIANITY
            ),
            introduction = Introduction(
                text = null,
                interests = listOf("여행", "맛집", "요가", "사진", "전시회"),
                interviewAnswers = InterviewAnswers(
                    hobby = "주말마다 새로운 맛집을 찾아다니는 걸 좋아해요. 요즘엔 요가에 빠져서 아침마다 스튜디오에 가고 있어요. 날씨 좋은 날엔 사진 찍으러 나가기도 하고요.",
                    charm = "항상 밝고 긍정적인 에너지를 가지고 있어요. 새로운 사람들을 만나는 걸 좋아하고, 사람들과 함께 있을 때 분위기를 즐겁게 만드는 편이에요.",
                    passion = "여행 계획 세우는 게 요즘 제 취미가 됐어요. 다음 여행지를 찾아보고 맛집 리스트를 만드는 시간이 너무 즐거워요.",
                    happiness = "친한 사람들과 맛있는 음식을 먹으면서 수다 떨 때, 그리고 새로운 곳을 여행하면서 예쁜 풍경을 보고 사진 찍을 때 행복해요.",
                    motto = "오늘 하루를 즐겁게 살자가 제 좌우명이에요. 매일매일을 의미있게 보내려고 노력합니다."
                )
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
                completionRate = 0,
                trustScore = 0,
                viewCount = 0
            ),
            settings = ProfileSettings.initial()
        ).recalculateMetrics()
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
                sigungu = "영등포구"
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = Frequency.NEVER,
                drinking = Frequency.SOMETIMES,
                religion = Religion.NONE
            ),
            introduction = Introduction(
                text = null,
                interests = listOf("헬스", "골프", "경제", "와인"),
                interviewAnswers = InterviewAnswers(
                    hobby = "평일엔 헬스장에서 운동하고, 주말엔 필드에 나가서 골프 치는 걸 좋아해요. 저녁에는 경제 뉴스나 투자 서적을 읽으며 시간을 보냅니다.",
                    charm = "책임감이 강하고 계획적인 성격이에요. 맡은 일은 끝까지 해내는 편이고, 주변 사람들이 믿고 의지할 수 있는 사람이 되려고 노력합니다.",
                    passion = "요즘 와인에 관심이 생겨서 소믈리에 자격증 공부를 하고 있어요. 주말마다 와인 시음회에도 참여하면서 공부하고 있습니다.",
                    happiness = "운동 후 개운한 느낌, 좋은 투자 수익이 났을 때, 그리고 가까운 사람들과 좋은 와인 한잔하면서 깊은 대화를 나눌 때 행복합니다.",
                    motto = "건강한 몸과 마음이 성공의 기초다라고 생각해요. 규칙적인 생활과 꾸준한 자기계발이 중요하다고 믿습니다."
                )
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
                completionRate = 0,
                trustScore = 0,
                viewCount = 0
            ),
            settings = ProfileSettings.initial()
        ).recalculateMetrics()
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
                sigungu = "송파구"
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = Frequency.NEVER,
                drinking = Frequency.SOMETIMES,
                religion = Religion.CATHOLICISM
            ),
            introduction = Introduction(
                text = null,
                interests = listOf("피아노", "독서", "영화", "베이킹", "그림"),
                interviewAnswers = InterviewAnswers(
                    hobby = "쉬는 날엔 집에서 피아노 연주하거나 베이킹을 즐겨요. 날씨 좋은 날엔 전시회나 영화를 보러 나가기도 하고, 조용한 카페에서 책 읽는 시간도 좋아합니다.",
                    charm = "따뜻하고 배려심이 많은 편이에요. 아이들을 가르치면서 인내심과 공감 능력이 많이 길러진 것 같아요. 사람들의 이야기를 잘 들어주는 편입니다.",
                    passion = "요즘 수채화 그림에 빠져있어요. 주말마다 미술 수업을 들으면서 그림 실력을 키우고 있는데 정말 힐링되는 시간이에요.",
                    happiness = "아이들이 성장하는 모습을 볼 때, 좋아하는 음악을 들으며 여유로운 시간을 보낼 때, 그리고 제가 만든 디저트를 사랑하는 사람들과 나눌 때 행복합니다.",
                    motto = "작은 것에서 행복을 찾자가 제 좌우명이에요. 일상의 소소한 순간들을 소중히 여기며 살아가려고 노력합니다."
                )
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
                completionRate = 0,
                trustScore = 0,
                viewCount = 0
            ),
            settings = ProfileSettings.initial()
        ).recalculateMetrics()
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
                sigungu = "종로구"
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = Frequency.NEVER,
                drinking = Frequency.NEVER,
                religion = Religion.BUDDHISM
            ),
            introduction = Introduction(
                text = null,
                interests = listOf("명상", "클래식", "독서", "산책"),
                interviewAnswers = InterviewAnswers(
                    hobby = "새벽에 명상하면서 하루를 시작해요. 퇴근 후엔 클래식 음악을 들으며 독서하는 시간을 가지고, 주말엔 한강이나 공원을 산책하며 여유를 즐깁니다.",
                    charm = "차분하고 신중한 성격이에요. 의사로서 환자들의 이야기를 경청하고 최선의 치료를 고민하다 보니, 자연스럽게 공감 능력과 인내심이 생긴 것 같아요.",
                    passion = "요즘 불교 철학과 명상에 깊이 빠져 있어요. 바쁜 일상 속에서 마음의 평온을 유지하는 방법을 배우고 있습니다.",
                    happiness = "환자가 건강을 회복하는 모습을 볼 때, 조용한 공간에서 클래식 음악을 들으며 책을 읽을 때, 그리고 자연 속에서 걸으며 생각을 정리할 때 행복합니다.",
                    motto = "중용의 삶을 추구합니다. 어떤 상황에서도 균형을 잃지 않고 차분하게 대처하려고 노력해요."
                )
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
                completionRate = 0,
                trustScore = 0,
                viewCount = 0
            ),
            settings = ProfileSettings.initial()
        ).recalculateMetrics()
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
