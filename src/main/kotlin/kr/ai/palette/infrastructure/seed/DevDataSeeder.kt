package kr.ai.palette.infrastructure.seed

import kr.ai.palette.persistence.matchmaker.MatchmakerEntity
import kr.ai.palette.persistence.matchmaker.MatchmakerJpaRepository
import kr.ai.palette.persistence.matchmaking.MatchmakingRequestEntity
import kr.ai.palette.persistence.matchmaking.MatchmakingRequestJpaRepository
import kr.ai.palette.persistence.profile.*
import kr.ai.palette.persistence.user.*
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

/**
 * 베타/개발 환경용 목 데이터 시더.
 *
 * 활성 조건:
 *  - SPRING_PROFILES_ACTIVE = dev | prod (베타 단계엔 prod 도 포함)
 *  - `app.seed-enabled=true` 설정 시 (default: true)
 *
 * 멱등성:
 *  - 고정 UUID (00000000-0000-0000-0000-000000000001) 의 테스트 계정 존재 시 skip
 *  - 실 유저 가입 후에도 안전하게 한 번만 실행됨
 *
 * 생성 데이터:
 *  - 로그인 테스트 계정 1명 (dev@palette.kr / devpass123)
 *  - 일반 유저 12명 (남6/여6) — 피드용
 *  - 주선자 유저 5명 (marketplace mock과 동일)
 *  - 주선 요청 3건 (pending/approved/completed)
 *
 * 정식 출시 후엔 application-prod.properties 에서 `app.seed-enabled=false` 로 비활성.
 */
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    name = ["app.seed-enabled"],
    havingValue = "true",
    matchIfMissing = true,
)
class DevDataSeeder(
    private val userRepo: UserJpaRepository,
    private val profileRepo: ProfileJpaRepository,
    private val photoRepo: ProfilePhotoJpaRepository,
    private val matchmakerRepo: MatchmakerJpaRepository,
    private val matchmakingRepo: MatchmakingRequestJpaRepository,
    private val passwordEncoder: PasswordEncoder,
) : ApplicationRunner {

    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    override fun run(args: ApplicationArguments) {
        // 멱등성 — 테스트 계정 (고정 UUID) 이 이미 있으면 skip
        // 실 유저들이 가입한 상태에서도 안전하게 한 번만 실행됨
        val testAccountId = UUID.fromString("00000000-0000-0000-0000-000000000001")
        if (userRepo.existsById(testAccountId)) {
            log.info("[Seeder] Test account exists — skipping seed")
            return
        }
        log.info("[Seeder] Seeding mock data (test accounts + matchmakers + sample requests)...")

        val now = Instant.now()
        val me = seedTestAccount(now)
        seedAdminAccount(now)
        val regularUsers = seedRegularUsers(now)
        val matchmakerUsers = seedMatchmakerUsers(now)
        val matchmakers = seedMatchmakers(matchmakerUsers, now)
        seedMatchmakingRequests(me, regularUsers, matchmakers, now)

        log.info("[Seeder] Done — ${userRepo.count()} users in DB")
        log.info("[Seeder] User login : dev@palette.kr / devpass123")
        log.info("[Seeder] Admin login: admin@palette.kr / adminpass123 (role=ADMIN)")
    }

    // ── 운영자 시드 계정 ─────────────────────────────────────────────────────
    private fun seedAdminAccount(now: Instant) {
        val adminId = UUID.fromString("00000000-0000-0000-0000-0000000000ad")
        if (userRepo.existsById(adminId)) return
        val admin = UserEntity(
            id = adminId,
            oauthProvider = null,
            oauthId = null,
            password = passwordEncoder.encode("adminpass123"),
            realName = "관리자",
            email = "admin@palette.kr",
            phoneNumber = "01000000000",
            isPhoneVerified = true,
            kakaoTalkId = null,
            preferredContactMethod = null,
            nickname = "팔레트 운영자",
            birthDate = LocalDate.of(1990, 1, 1),
            gender = GenderEntity.MALE,
            accountType = AccountTypeEntity.REGULAR,
            isProfileCompleted = false,    // 운영자는 일반 서비스 안 씀
            agreedTermsService = true,
            agreedTermsPrivacy = true,
            agreedMarketing = false,
            agreedAt = now,
            createdAt = now,
            updatedAt = now,
            lastLoginAt = now,
            role = kr.ai.palette.persistence.user.UserRoleEntity.ADMIN,
        )
        userRepo.save(admin)
    }

    // ── 테스트 로그인 계정 ────────────────────────────────────────────────────
    private fun seedTestAccount(now: Instant): UserEntity {
        val userId = UUID.fromString("00000000-0000-0000-0000-000000000001")
        val user = UserEntity(
            id = userId,
            oauthProvider = null,
            oauthId = null,
            password = passwordEncoder.encode("devpass123"),
            realName = "김팔레트",
            email = "dev@palette.kr",
            phoneNumber = "01012345678",
            isPhoneVerified = true,
            kakaoTalkId = null,
            preferredContactMethod = null,
            nickname = "팔레트개발자",
            birthDate = LocalDate.of(1996, 3, 15),
            gender = GenderEntity.MALE,
            accountType = AccountTypeEntity.REGULAR,
            isProfileCompleted = true,
            agreedTermsService = true,
            agreedTermsPrivacy = true,
            agreedMarketing = false,
            agreedAt = now,
            createdAt = now,
            updatedAt = now,
            lastLoginAt = now,
        )
        userRepo.save(user)

        val profileId = UUID.fromString("00000000-0000-0000-0001-000000000001")
        profileRepo.save(buildProfile(
            id = profileId, userId = userId, now = now,
            height = 178, bodyType = BodyTypeEntity.AVERAGE,
            mbti = MBTIEntity.ENFP, career = CareerCategoryEntity.IT_DEVELOPMENT,
            sido = "서울", sigungu = "강남구",
            smoking = FrequencyEntity.NEVER, drinking = FrequencyEntity.SOMETIMES,
            religion = ReligionEntity.NONE,
            interests = "여행,카페,코딩,음악,영화",
            introText = "안녕하세요! 팔레트 개발자 테스트 계정입니다. 좋은 인연 찾고 있어요 :)",
            colorType = "orange", trustScore = 85,
        ))

        seedPhotos(profileId, listOf(
            "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400",
        ), now)

        return user
    }

    // ── 일반 유저 12명 (피드 노출용) ──────────────────────────────────────────
    private fun seedRegularUsers(now: Instant): List<UserEntity> {
        val users = listOf(
            // 여성 6명
            SeedUser("지수", "이지수", "01011110001", LocalDate.of(1998, 4, 10), GenderEntity.FEMALE,
                178, BodyTypeEntity.SLIM, MBTIEntity.ISTJ, CareerCategoryEntity.FINANCE,
                "서울", "강남구", FrequencyEntity.NEVER, FrequencyEntity.SOMETIMES, ReligionEntity.NONE,
                "독서,요가,카페,여행", "blue", 75,
                listOf("https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400",
                    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400"),
                "차분하고 배려심 있는 성격이에요. 진지한 만남 원해요."),
            SeedUser("하은", "박하은", "01011110002", LocalDate.of(1997, 7, 22), GenderEntity.FEMALE,
                160, BodyTypeEntity.SLIM, MBTIEntity.INFJ, CareerCategoryEntity.MEDIA,
                "서울", "마포구", FrequencyEntity.NEVER, FrequencyEntity.SOMETIMES, ReligionEntity.CHRISTIANITY,
                "그림,음악,독서,영화", "pink", 65,
                listOf("https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?w=400",
                    "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400"),
                "감성적이고 따뜻한 사람이에요. 의미있는 만남 좋아해요."),
            SeedUser("수현", "최수현", "01011110003", LocalDate.of(1995, 11, 5), GenderEntity.FEMALE,
                168, BodyTypeEntity.ATHLETIC, MBTIEntity.ENTJ, CareerCategoryEntity.PROFESSIONAL,
                "서울", "송파구", FrequencyEntity.NEVER, FrequencyEntity.OFTEN, ReligionEntity.NONE,
                "운동,자기계발,여행,맛집", "green", 80,
                listOf("https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400"),
                "목표 지향적이고 활발해요. 함께 성장하는 파트너 찾아요."),
            SeedUser("예진", "강예진", "01011110004", LocalDate.of(1999, 2, 28), GenderEntity.FEMALE,
                163, BodyTypeEntity.SLIM, MBTIEntity.ESFP, CareerCategoryEntity.EDUCATION,
                "경기", "성남시", FrequencyEntity.NEVER, FrequencyEntity.SOMETIMES, ReligionEntity.NONE,
                "댄스,노래,카페,쇼핑", "yellow", 70,
                listOf("https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400"),
                "밝고 에너지 넘쳐요! 같이 웃을 수 있는 사람 만나고 싶어요."),
            SeedUser("서연", "윤서연", "01011110005", LocalDate.of(1996, 9, 14), GenderEntity.FEMALE,
                165, BodyTypeEntity.AVERAGE, MBTIEntity.INFP, CareerCategoryEntity.IT_DEVELOPMENT,
                "서울", "성동구", FrequencyEntity.NEVER, FrequencyEntity.SOMETIMES, ReligionEntity.NONE,
                "독서,코딩,카페,게임", "purple", 78,
                listOf("https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400"),
                "개발자예요. 조용하지만 대화 나누면 할 말 많아요 😄"),
            SeedUser("민지", "정민지", "01011110006", LocalDate.of(1997, 5, 30), GenderEntity.FEMALE,
                162, BodyTypeEntity.SLIM, MBTIEntity.ENFJ, CareerCategoryEntity.MEDICAL,
                "서울", "관악구", FrequencyEntity.NEVER, FrequencyEntity.NEVER, ReligionEntity.NONE,
                "요리,여행,봉사,독서", "orange", 82,
                listOf("https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400"),
                "간호사예요. 사람 돌보는 걸 좋아해요. 건강한 만남 원해요."),
            // 남성 6명
            SeedUser("준혁", "김준혁", "01011110007", LocalDate.of(1994, 8, 17), GenderEntity.MALE,
                180, BodyTypeEntity.ATHLETIC, MBTIEntity.ENTP, CareerCategoryEntity.IT_DEVELOPMENT,
                "서울", "강남구", FrequencyEntity.NEVER, FrequencyEntity.SOMETIMES, ReligionEntity.NONE,
                "운동,테니스,스타트업,여행", "orange", 88,
                listOf("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"),
                "스타트업 개발자예요. 활발하고 도전적인 사람이에요."),
            SeedUser("태양", "박태양", "01011110008", LocalDate.of(1993, 12, 3), GenderEntity.MALE,
                175, BodyTypeEntity.MUSCULAR, MBTIEntity.ESTJ, CareerCategoryEntity.FINANCE,
                "서울", "여의도", FrequencyEntity.NEVER, FrequencyEntity.SOMETIMES, ReligionEntity.NONE,
                "골프,테니스,독서,여행", "blue", 72,
                listOf("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"),
                "금융업 종사자. 안정적이고 신중한 성격이에요."),
            SeedUser("민수", "이민수", "01011110009", LocalDate.of(1995, 6, 20), GenderEntity.MALE,
                172, BodyTypeEntity.AVERAGE, MBTIEntity.ISFJ, CareerCategoryEntity.EDUCATION,
                "경기", "수원시", FrequencyEntity.NEVER, FrequencyEntity.NEVER, ReligionEntity.CHRISTIANITY,
                "기타,독서,캠핑,요리", "green", 68,
                listOf("https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400"),
                "중학교 선생님이에요. 배려심 있고 가정적인 사람이에요."),
            SeedUser("재원", "조재원", "01011110010", LocalDate.of(1996, 1, 8), GenderEntity.MALE,
                177, BodyTypeEntity.SLIM, MBTIEntity.INTP, CareerCategoryEntity.IT_DEVELOPMENT,
                "서울", "마포구", FrequencyEntity.NEVER, FrequencyEntity.SOMETIMES, ReligionEntity.NONE,
                "게임,애니,독서,코딩", "purple", 60,
                listOf("https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400"),
                "백엔드 개발자. 조용하지만 관심사 맞으면 엄청 수다스러워요 ㅎ"),
            SeedUser("성호", "한성호", "01011110011", LocalDate.of(1992, 3, 25), GenderEntity.MALE,
                183, BodyTypeEntity.ATHLETIC, MBTIEntity.ESTP, CareerCategoryEntity.PROFESSIONAL,
                "서울", "강서구", FrequencyEntity.SOMETIMES, FrequencyEntity.SOMETIMES, ReligionEntity.NONE,
                "축구,헬스,여행,맛집", "red", 76,
                listOf("https://images.unsplash.com/photo-1463453091185-61582044d556?w=400"),
                "변호사예요. 바쁘지만 소중한 사람한텐 다 줄 수 있어요."),
            SeedUser("현우", "류현우", "01011110012", LocalDate.of(1997, 10, 11), GenderEntity.MALE,
                174, BodyTypeEntity.AVERAGE, MBTIEntity.ENFP, CareerCategoryEntity.MEDIA,
                "서울", "홍대", FrequencyEntity.NEVER, FrequencyEntity.SOMETIMES, ReligionEntity.NONE,
                "사진,여행,영화,음악", "yellow", 74,
                listOf("https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=400"),
                "영상 PD예요. 감성적인 일상 즐기는 걸 좋아해요."),
        )

        return users.mapIndexed { idx, s ->
            val userId = UUID.fromString("00000000-0000-0000-0002-%012d".format(idx + 1))
            val user = UserEntity(
                id = userId, oauthProvider = null, oauthId = null,
                password = passwordEncoder.encode("devpass123"),
                realName = s.realName, email = "user${idx + 1}@dev.palette.kr",
                phoneNumber = s.phone, isPhoneVerified = true,
                kakaoTalkId = null, preferredContactMethod = null,
                nickname = s.nickname + (idx + 1),
                birthDate = s.birthDate, gender = s.gender,
                accountType = AccountTypeEntity.REGULAR, isProfileCompleted = true,
                agreedTermsService = true, agreedTermsPrivacy = true,
                agreedAt = now, createdAt = now.minusSeconds((idx * 3600).toLong()),
                updatedAt = now, lastLoginAt = now,
            )
            userRepo.save(user)

            val profileId = UUID.fromString("00000000-0000-0000-0003-%012d".format(idx + 1))
            profileRepo.save(buildProfile(
                id = profileId, userId = userId, now = now,
                height = s.height, bodyType = s.bodyType, mbti = s.mbti, career = s.career,
                sido = s.sido, sigungu = s.sigungu,
                smoking = s.smoking, drinking = s.drinking, religion = s.religion,
                interests = s.interests, introText = s.introText,
                colorType = s.colorType, trustScore = s.trustScore,
            ))
            seedPhotos(profileId, s.photos, now)
            user
        }
    }

    // ── 주선자 유저 5명 ────────────────────────────────────────────────────────
    private fun seedMatchmakerUsers(now: Instant): List<UserEntity> {
        val matchmakers = listOf(
            Triple("박주선", LocalDate.of(1988, 5, 10), GenderEntity.MALE),
            Triple("김연결", LocalDate.of(1985, 8, 22), GenderEntity.FEMALE),
            Triple("이다연", LocalDate.of(1991, 3, 15), GenderEntity.FEMALE),
            Triple("최공무", LocalDate.of(1987, 11, 7), GenderEntity.MALE),
            Triple("정금융", LocalDate.of(1986, 2, 28), GenderEntity.MALE),
        )
        return matchmakers.mapIndexed { idx, (name, birth, gender) ->
            val userId = UUID.fromString("00000000-0000-0000-0004-%012d".format(idx + 1))
            val user = UserEntity(
                id = userId, oauthProvider = null, oauthId = null,
                password = passwordEncoder.encode("devpass123"),
                realName = name, email = "mm${idx + 1}@dev.palette.kr",
                phoneNumber = "0102222%04d".format(idx + 1),
                isPhoneVerified = true, kakaoTalkId = null, preferredContactMethod = null,
                nickname = name + "주선자",
                birthDate = birth, gender = gender,
                accountType = AccountTypeEntity.REGULAR,
                isProfileCompleted = true,
                agreedTermsService = true, agreedTermsPrivacy = true,
                agreedAt = now, createdAt = now, updatedAt = now, lastLoginAt = now,
            )
            userRepo.save(user)

            val profileId = UUID.fromString("00000000-0000-0000-0005-%012d".format(idx + 1))
            profileRepo.save(buildProfile(
                id = profileId, userId = userId, now = now,
                height = if (gender == GenderEntity.MALE) 175 else 163,
                bodyType = BodyTypeEntity.AVERAGE, mbti = MBTIEntity.ENFJ,
                career = CareerCategoryEntity.IT_DEVELOPMENT,
                sido = "서울", sigungu = "강남구",
                smoking = FrequencyEntity.NEVER, drinking = FrequencyEntity.SOMETIMES,
                religion = ReligionEntity.NONE,
                interests = "네트워킹,사람,여행",
                introText = "주선 전문가입니다. 좋은 인연 만들어드릴게요!",
                colorType = listOf("orange", "blue", "pink", "gray", "red")[idx],
                trustScore = 80,
            ))
            user
        }
    }

    // ── Matchmaker 엔티티 생성 ─────────────────────────────────────────────────
    private fun seedMatchmakers(users: List<UserEntity>, now: Instant): List<MatchmakerEntity> {
        data class MMStats(val level: Int, val rate: Double, val success: Int,
                          val total: Int, val rating: Double, val reviews: Int,
                          val bio: String, val specialties: String)

        val stats = listOf(
            MMStats(5, 0.50, 28, 45, 4.9, 24,
                "IT 업계 10년차. 강남/판교 네트워크 탄탄해요.",
                """["IT/개발","30대","서울","진지한연애"]"""),
            MMStats(4, 0.45, 16, 27, 4.7, 14,
                "의료계 종사자. 병원·제약 지인 많아요.",
                """["의료","30대","경기","결혼목적"]"""),
            MMStats(4, 0.45, 14, 22, 4.8, 12,
                "패션/뷰티 업계. 20~30대 감각 있는 분들을 잘 알아요.",
                """["20대","30대","서울","자연스럽게"]"""),
            MMStats(3, 0.40, 9, 18, 4.5, 8,
                "공무원 5년차. 안정적인 직종 지인 많아요.",
                """["공무원","30대","지방","결혼목적"]"""),
            MMStats(3, 0.40, 8, 15, 4.3, 7,
                "증권사·은행 네트워크. 금융권 만남 전문.",
                """["금융/보험","30대","서울","진지한연애"]"""),
        )

        return users.mapIndexed { idx, user ->
            val s = stats[idx]
            val entity = MatchmakerEntity(
                id = UUID.fromString("00000000-0000-0000-0006-%012d".format(idx + 1)),
                userId = user.id,
                totalMatchRequests = s.total,
                approvedRequests = s.success + 2,
                rejectedRequests = s.total - s.success - 2,
                successfulMatches = s.success,
                failedMatches = 2,
                level = s.level,
                commissionRate = s.rate,
                totalPoints = s.success * 1500,
                withdrawnPoints = s.success * 1000,
                pendingPoints = s.success * 500,
                bio = s.bio,
                specialties = s.specialties,
                isPublicProfile = true,
                averageRating = s.rating,
                totalReviews = s.reviews,
                createdAt = now,
                updatedAt = now,
            )
            matchmakerRepo.save(entity)
        }
    }

    // ── 주선 요청 3건 ─────────────────────────────────────────────────────────
    private fun seedMatchmakingRequests(
        me: UserEntity,
        regularUsers: List<UserEntity>,
        matchmakers: List<MatchmakerEntity>,
        now: Instant,
    ) {
        val ldt = LocalDateTime.now()

        // 요청1: pending (주선자 미결정)
        matchmakingRepo.save(MatchmakingRequestEntity(
            id = UUID.fromString("00000000-0000-0000-0007-000000000001"),
            requesterId = me.id,
            targetUserId = regularUsers[0].id,  // 지수
            matchmakerId = matchmakers[0].userId,
            requesterMessage = "지수씨 소개 부탁드려요! 취향이 잘 맞을 것 같아요.",
            matchmakerDecidedAt = null, matchmakerMessage = null, matchmakerApproved = null,
            targetDecidedAt = null, targetMessage = null, targetAccepted = null,
            status = "PENDING",
            createdAt = ldt.minusDays(2), updatedAt = ldt.minusDays(2),
        ))

        // 요청2: 주선자 승인 → 상대방 대기
        matchmakingRepo.save(MatchmakingRequestEntity(
            id = UUID.fromString("00000000-0000-0000-0007-000000000002"),
            requesterId = me.id,
            targetUserId = regularUsers[1].id,  // 하은
            matchmakerId = matchmakers[1].userId,
            requesterMessage = "하은씨 소개해주실 수 있나요?",
            matchmakerDecidedAt = ldt.minusDays(1), matchmakerApproved = true,
            matchmakerMessage = "하은씨한테 먼저 물어볼게요! 좋은 인연 될 것 같아요.",
            targetDecidedAt = null, targetMessage = null, targetAccepted = null,
            status = "MATCHMAKER_APPROVED",
            createdAt = ldt.minusDays(3), updatedAt = ldt.minusDays(1),
        ))

        // 요청3: 성사 완료
        matchmakingRepo.save(MatchmakingRequestEntity(
            id = UUID.fromString("00000000-0000-0000-0007-000000000003"),
            requesterId = regularUsers[6].id,   // 준혁이 → 서연에게
            targetUserId = regularUsers[4].id,  // 서연
            matchmakerId = matchmakers[2].userId,
            requesterMessage = "서연씨랑 잘 맞을 것 같아요.",
            matchmakerDecidedAt = ldt.minusDays(10), matchmakerApproved = true,
            matchmakerMessage = "둘 다 개발자라서 공통점 많을 것 같아요!",
            targetDecidedAt = ldt.minusDays(8), targetAccepted = true,
            targetMessage = "만나보고 싶어요!",
            status = "COMPLETED",
            createdAt = ldt.minusDays(14), updatedAt = ldt.minusDays(8),
        ))
    }

    // ── 헬퍼: ProfileEntity ────────────────────────────────────────────────────
    private fun buildProfile(
        id: UUID, userId: UUID, now: Instant,
        height: Int, bodyType: BodyTypeEntity, mbti: MBTIEntity,
        career: CareerCategoryEntity, sido: String, sigungu: String,
        smoking: FrequencyEntity, drinking: FrequencyEntity, religion: ReligionEntity,
        interests: String, introText: String, colorType: String, trustScore: Int,
    ) = ProfileEntity(
        id = id, userId = userId,
        height = height, bodyType = bodyType, mbti = mbti,
        careerCategory = career, company = null, incomeRange = null,
        educationLevel = EducationLevelEntity.BACHELOR, school = null, major = null,
        sido = sido, sigungu = sigungu,
        smoking = smoking, drinking = drinking, religion = religion,
        interests = interests,
        introductionHobby = null, introductionCharm = null,
        introductionPassion = null, introductionHappiness = null, introductionMotto = null,
        introductionText = introText,
        idealDatePreferences = "CAFE,MOVIE", idealImportantValues = "HUMOR,GROWTH",
        idealPersonalities = "BRIGHT,WARM,SMART", idealAppearanceStyles = null,
        idealDealBreakers = null,
        tasteStack = null, bucketList = null, personalityTests = null,
        colorType = colorType,
        createdAt = now, updatedAt = now, lastAccessedAt = now, deletedAt = null,
        completionRate = 80, trustScore = trustScore,
        viewCount = (5..100).random(), isAcceptingMatches = true, hiddenAt = null,
        hometownSido = null, hometownSigungu = null,
        attachmentContactAnxiety = null, attachmentIntimacyAvoidance = null,
        attachmentConflictStyle = null, attachmentEmotionExpression = null,
        attachmentIndependenceLevel = null,
    )

    // ── 헬퍼: ProfilePhoto ────────────────────────────────────────────────────
    private fun seedPhotos(profileId: UUID, urls: List<String>, now: Instant) {
        urls.forEachIndexed { idx, url ->
            photoRepo.save(ProfilePhotoEntity(
                id = UUID.randomUUID(),
                profileId = profileId,
                s3Key = "seed/photo-${profileId}-$idx",
                url = url,
                displayOrder = idx,
                isPrimary = idx == 0,
                trustFactor = TrustFactorEntity.SELFIE,
                trustScore = 20,
                aiHasFace = true, aiHasFullBody = false, aiHasClearFace = true,
                aiQualityScore = 75, aiIsSelfie = true, aiIsTakenByOthers = false,
                aiIsOverProcessed = false, aiRawData = null,
                createdAt = now,
            ))
        }
    }

    // ── 시드용 데이터 클래스 ──────────────────────────────────────────────────
    private data class SeedUser(
        val nickname: String, val realName: String, val phone: String,
        val birthDate: LocalDate, val gender: GenderEntity,
        val height: Int, val bodyType: BodyTypeEntity, val mbti: MBTIEntity,
        val career: CareerCategoryEntity, val sido: String, val sigungu: String,
        val smoking: FrequencyEntity, val drinking: FrequencyEntity,
        val religion: ReligionEntity, val interests: String,
        val colorType: String, val trustScore: Int,
        val photos: List<String>, val introText: String,
    )
}
