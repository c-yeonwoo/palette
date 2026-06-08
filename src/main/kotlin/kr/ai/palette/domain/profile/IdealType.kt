package kr.ai.palette.domain.profile

data class IdealType(
    val datePreferences: List<DatePreference>, // 하위호환용 (버킷리스트로 대체됨)
    val importantValues: List<ImportantValue>, // 최대 3개
    val personalities: List<String>, // 최대 5개
    val appearanceStyles: List<String>, // MaleAppearanceStyle or FemaleAppearanceStyle enum values
    val dealBreakers: List<DealBreaker>, // 최대 3개
    val bucketList: List<String> = emptyList(), // 시스템 키 or "custom:자유입력" 형식, 최대 10개
    // DA-001 — 나이/키 범위. UI 입력은 있었으나 도메인 부재로 저장·노출 안 되던 갭 해소.
    /** 선호 최소 연령 (만, 19+). null = 제한 없음 */
    val ageMin: Int? = null,
    /** 선호 최대 연령 (만). null = 제한 없음 */
    val ageMax: Int? = null,
    /** 선호 최소 키 (cm, 140~210). null = 제한 없음 */
    val heightMin: Int? = null,
    /** 선호 최대 키 (cm). null = 제한 없음 */
    val heightMax: Int? = null,
)

// 데이트 선호 스타일
enum class DatePreference {
    ACTIVE,   // 액티브한 데이트 (여행, 운동, 액티비티)
    INDOOR,   // 인도어 데이트 (집, 카페, 영화관)
    CULTURE,  // 문화 데이트 (전시, 공연, 맛집 투어)
    NATURE    // 자연 데이트 (산책, 드라이브, 피크닉)
}

// 중요하게 보는 가치 (최대 3개 선택)
enum class ImportantValue {
    PERSONALITY,   // 성격/성향
    APPEARANCE,    // 외모
    EDUCATION,     // 학력
    CAREER,        // 능력/커리어
    FAMILY,        // 집안/가족
    JOB,           // 직업
    WEALTH,        // 경제력
    VALUES         // 가치관
}

// Deal Breakers (최대 3개 선택)
enum class DealBreaker {
    SMOKING,              // 흡연자
    HEAVY_DRINKING,       // 과음하는 사람
    DISLIKES_PETS,        // 반려동물을 싫어하는 사람
    LONG_DISTANCE,        // 장거리 연애
    DIFFERENT_RELIGION,   // 종교가 다른 사람
    NO_MARRIAGE_PLAN,     // 결혼 의사가 없는 사람
    CHILDREN_PLAN,        // 자녀 계획이 맞지 않는 사람
    UNSTABLE_JOB,         // 직업이 불안정한 사람
    CONTACTS_EX,          // 전 연인과 연락하는 사람
    LARGE_AGE_GAP         // 나이 차이가 많이 나는 사람
}

// 남자 외모 스타일 (여자 유저가 선택)
enum class MaleAppearanceStyle {
    PUPPY,           // 강아지상
    CAT,             // 고양이상
    STUDENT_COUNCIL, // 전교회장상
    ATHLETIC,        // 체대상
    NERD,            // 너드상
    TOFU,            // 두부상
    ARAB,            // 아랍상
    DINOSAUR         // 공룡상
}

// 여자 외모 스타일 (남자 유저가 선택)
enum class FemaleAppearanceStyle {
    PUPPY,                 // 강아지상
    CAT,                   // 고양이상
    RABBIT,                // 토끼상
    FOX,                   // 여우상
    DEER,                  // 사슴상
    TOFU,                  // 두부상
    SOFT_TOFU,             // 순두부상
    ARAB,                  // 아랍상
    BOSS,                  // 일진상
    MOTHER_IN_LAW_APPROVED // 상견례입구컷상
}
