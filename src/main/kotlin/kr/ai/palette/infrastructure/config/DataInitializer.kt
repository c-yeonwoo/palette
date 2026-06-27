package kr.ai.palette.infrastructure.config

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.*
import kr.ai.palette.domain.profile.*
import kr.ai.palette.domain.matchmaker.*
import kr.ai.palette.domain.friendship.*
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.LocalDate
import java.util.*

@Component
@org.springframework.context.annotation.Profile("!prod")  // 테스트 계정(test1234)은 prod 에 생성 금지
class DataInitializer(
    private val userRepository: UserRepository,
    private val profileRepository: ProfileRepository,
    private val matchmakerRepository: MatchmakerRepository,
    private val friendshipRepository: FriendshipRepository,
    private val passwordEncoder: PasswordEncoder
) : ApplicationRunner {

    override fun run(args: ApplicationArguments) {
        // 이미 시드 데이터가 있으면 중복 삽입 방지
        if (userRepository.existsByNickname("개발하는민준")) return
        createTestUsers()
        createTestProfiles()
        createTestMatchmakers()
        createTestFriendships()
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
                phoneNumber = "010-1234-5678",
                isPhoneVerified = false, // 핸드폰 미인증 상태
                contactInfo = ContactInfo.create("010-1234-5678")
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
                phoneNumber = "010-2345-6789",
                isPhoneVerified = true, // 핸드폰 인증 완료
                contactInfo = ContactInfo.create("010-2345-6789")
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
                phoneNumber = "010-3456-7890",
                isPhoneVerified = false, // 핸드폰 미인증 상태
                contactInfo = ContactInfo.create("010-3456-7890")
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
                phoneNumber = "010-4567-8901",
                isPhoneVerified = true, // 핸드폰 인증 완료
                contactInfo = ContactInfo.create("010-4567-8901")
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
                phoneNumber = "010-5678-9012",
                isPhoneVerified = true, // 핸드폰 인증 완료
                contactInfo = ContactInfo.create("010-5678-9012")
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
                phoneNumber = "010-6789-0123",
                isPhoneVerified = true, // 핸드폰 인증 완료
                contactInfo = ContactInfo.create("010-6789-0123")
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
                phoneNumber = "010-7890-1234",
                isPhoneVerified = true, // 핸드폰 인증 완료
                contactInfo = ContactInfo.create("010-7890-1234")
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
                bodyType = BodyType.ATHLETIC.name,
                mbti = MBTI.ENFP
            ),
            careerInfo = CareerInfo(
                category = CareerCategory.IT_DEVELOPMENT,
                company = "네이버",
                incomeRange = IncomeRange.INCOME_RANGE_4 // 9000~11000만원
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
                smoking = Frequency.NEVER.name,
                drinking = Frequency.SOMETIMES.name,
                religion = Religion.NONE.name
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
                datePreferences = listOf(DatePreference.ACTIVE.name, DatePreference.CULTURE.name),
                importantValues = listOf(ImportantValue.PERSONALITY.name, ImportantValue.CAREER.name, ImportantValue.VALUES.name),
                personalities = listOf("밝은", "유머러스한", "지적인"),
                appearanceStyles = listOf("CAT"), // 남성 유저 -> 여자 스타일 (하나만 선택)
                dealBreakers = listOf(DealBreaker.SMOKING.name, DealBreaker.CONTACTS_EX.name)
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
            personalityTests = listOf(
                PersonalityTestResult(
                    link = "https://mbti.cidermics.com/result?userNo=U2FsdGVkX1%2Bw2hOXTG2IkwFvhHr7GuGlTQgJQjf021Q%3D",
                    title = "절제가 쉽지 않지만 노력중인 멋쟁이"
                )
            ),
            colorType = ColorType(
                type = ColorTypeEnum.WARM_ORANGE,
                name = "따뜻한 오렌지",
                hex = "#FF8C42",
                description = "활발하고 다정한 당신은 주변을 밝게 만드는 에너지가 있어요"
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
                bodyType = BodyType.SLIM.name,
                mbti = MBTI.ISFJ
            ),
            careerInfo = CareerInfo(
                category = CareerCategory.MEDIA,
                company = "카카오",
                incomeRange = IncomeRange.INCOME_RANGE_3 // 7500~9000만원
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
                smoking = Frequency.NEVER.name,
                drinking = Frequency.OFTEN.name,
                religion = Religion.CHRISTIANITY.name
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
                datePreferences = listOf(DatePreference.ACTIVE.name, DatePreference.NATURE.name),
                importantValues = listOf(ImportantValue.PERSONALITY.name, ImportantValue.CAREER.name, ImportantValue.APPEARANCE.name),
                personalities = listOf("유머러스한", "배려심있는", "적극적인"),
                appearanceStyles = listOf("STUDENT_COUNCIL"), // 여성 유저 -> 남자 스타일 (하나만 선택)
                dealBreakers = listOf(DealBreaker.SMOKING.name, DealBreaker.UNSTABLE_JOB.name)
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
            personalityTests = emptyList(),
            colorType = ColorType(
                type = ColorTypeEnum.SOFT_PINK,
                name = "부드러운 핑크",
                hex = "#F48FB1",
                description = "섬세하고 낭만적인 당신은 감성이 풍부하고 따뜻한 마음을 가졌어요"
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
                bodyType = BodyType.MUSCULAR.name,
                mbti = MBTI.ENTJ
            ),
            careerInfo = CareerInfo(
                category = CareerCategory.FINANCE,
                company = "삼성증권",
                incomeRange = IncomeRange.INCOME_RANGE_5 // 11000만원 이상
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
                smoking = Frequency.NEVER.name,
                drinking = Frequency.SOMETIMES.name,
                religion = Religion.NONE.name
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
                datePreferences = listOf(DatePreference.CULTURE.name, DatePreference.INDOOR.name),
                importantValues = listOf(ImportantValue.PERSONALITY.name, ImportantValue.FAMILY.name, ImportantValue.VALUES.name),
                personalities = listOf("차분한", "이해심있는", "따뜻한"),
                appearanceStyles = listOf("DEER"), // 남성 유저 -> 여자 스타일 (하나만 선택)
                dealBreakers = listOf(DealBreaker.SMOKING.name, DealBreaker.HEAVY_DRINKING.name, DealBreaker.CONTACTS_EX.name)
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
            personalityTests = emptyList(),
            colorType = ColorType(
                type = ColorTypeEnum.CALM_BLUE,
                name = "차분한 블루",
                hex = "#4A90D9",
                description = "신중하고 깊이있는 당신은 믿음직한 존재감을 가지고 있어요"
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
                bodyType = BodyType.AVERAGE.name,
                mbti = MBTI.INFP
            ),
            careerInfo = CareerInfo(
                category = CareerCategory.EDUCATION,
                company = "서울시립초등학교",
                incomeRange = IncomeRange.INCOME_RANGE_2 // 5000~7500만원
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
                smoking = Frequency.NEVER.name,
                drinking = Frequency.SOMETIMES.name,
                religion = Religion.CATHOLICISM.name
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
                datePreferences = listOf(DatePreference.INDOOR.name, DatePreference.CULTURE.name),
                importantValues = listOf(ImportantValue.PERSONALITY.name, ImportantValue.FAMILY.name, ImportantValue.JOB.name),
                personalities = listOf("따뜻한", "책임감있는", "가정적인"),
                appearanceStyles = listOf("TOFU"), // 여성 유저 -> 남자 스타일 (하나만 선택)
                dealBreakers = listOf(DealBreaker.SMOKING.name, DealBreaker.HEAVY_DRINKING.name)
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
            personalityTests = emptyList(),
            colorType = ColorType(
                type = ColorTypeEnum.FRESH_GREEN,
                name = "신선한 그린",
                hex = "#4CAF50",
                description = "자연스럽고 편안한 당신은 함께 있으면 마음이 편안해지는 사람이에요"
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
                bodyType = BodyType.AVERAGE.name,
                mbti = MBTI.INTJ
            ),
            careerInfo = CareerInfo(
                category = CareerCategory.MEDICAL,
                company = "서울대학교병원",
                incomeRange = IncomeRange.INCOME_RANGE_5 // 11000만원 이상
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
                smoking = Frequency.NEVER.name,
                drinking = Frequency.NEVER.name,
                religion = Religion.BUDDHISM.name
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
                datePreferences = listOf(DatePreference.CULTURE.name, DatePreference.NATURE.name),
                importantValues = listOf(ImportantValue.PERSONALITY.name, ImportantValue.VALUES.name, ImportantValue.EDUCATION.name),
                personalities = listOf("차분한", "이해심있는", "지적인"),
                appearanceStyles = listOf("CAT"), // 남성 유저 -> 여자 스타일 (하나만 선택)
                dealBreakers = listOf(DealBreaker.SMOKING.name, DealBreaker.HEAVY_DRINKING.name)
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
            personalityTests = emptyList(),
            colorType = ColorType(
                type = ColorTypeEnum.ELEGANT_PURPLE,
                name = "고급스러운 퍼플",
                hex = "#9B59B6",
                description = "지적이고 감각적인 당신은 독특한 매력과 깊은 내면을 가지고 있어요"
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
                commissionRate = 0.15
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
                commissionRate = 0.15
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
                commissionRate = 0.15
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
                commissionRate = 0.25
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
                commissionRate = 0.20
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

    private fun createTestFriendships() {
        val now = Instant.now()

        // 명시적 체인 구조로 2촌 관계 보장:
        // minjun(M) — 1촌: hyewon(F), jihoon(M)
        //   hyewon(F) — 친구: minjun, seoyeon(F), dohyun(M)  → seoyeon이 minjun의 2촌(F)
        //   jihoon(M) — 친구: minjun, yujin(F)                → yujin이 minjun의 2촌(F)
        // sangho(M)  — 1촌: seoyeon(F), dohyun(M)
        // → minjun의 피드에 seoyeon(F), yujin(F) 표시됨
        val pairs = listOf(
            "minjun" to "hyewon",
            "minjun" to "jihoon",
            "hyewon" to "seoyeon",
            "hyewon" to "dohyun",
            "jihoon" to "yujin",
            "sangho" to "seoyeon",
            "sangho" to "dohyun",
        )

        var count = 0
        pairs.forEach { (keyA, keyB) ->
            val idA = testUserIds[keyA] ?: return@forEach
            val idB = testUserIds[keyB] ?: return@forEach

            if (friendshipRepository.existsBetweenUsers(idA, idB)) return@forEach

            friendshipRepository.save(
                Friendship(
                    id = FriendshipId.generate(),
                    user1Id = idA,
                    user2Id = idB,
                    status = FriendshipStatus.ACCEPTED,
                    createdAt = now,
                    acceptedAt = now,
                )
            )
            count++
        }

        println("✅ Friendship mock data initialized successfully!")
        println("👥 Created $count friendships")

        // 각 유저의 친구 수와 2촌 수 출력
        testUserIds.forEach { (key, userId) ->
            val friendIds = friendshipRepository.findFriendIdsByUserId(userId)
            val secondDegreeIds = friendshipRepository.findSecondDegreeFriendIds(userId)
            println("  - $key: ${friendIds.size}명의 친구, ${secondDegreeIds.size}명의 2촌")
        }
    }
}
