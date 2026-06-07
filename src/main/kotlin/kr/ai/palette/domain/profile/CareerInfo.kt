package kr.ai.palette.domain.profile

data class CareerInfo(
    val category: CareerCategory?,
    val company: String?,
    val incomeRange: IncomeRange?
)

/**
 * 직군 분류 — 데이팅 매칭 시그널·필터·요약 표시에 사용.
 *
 * ⚠️ enum 값은 DB 컬럼에 그대로 저장되므로 기존 값 제거/이름 변경 금지.
 *   라벨/순서는 프론트 SoT(`frontend/src/lib/jobCategory.ts`)에서 관리.
 *
 * - 초기 10: 베타 1차 풀 (호환을 위해 유지). PROFESSIONAL 은 legacy bucket
 *   으로 잔존 데이터용. 신규 가입자는 LAW/ACCOUNTING_TAX/RESEARCH 등 세부로 유도.
 * - 확장 풀: 데이팅 도메인 확장 (ADR 0036).
 */
enum class CareerCategory {
    // ── 초기 10 (기존 데이터 호환) ──
    IT_DEVELOPMENT,
    FINANCE,
    EDUCATION,
    MEDICAL,
    MEDIA,
    SERVICE,
    MANUFACTURING,
    PUBLIC_OFFICIAL,
    PROFESSIONAL,
    OTHER,

    // ── 확장 풀 ──
    DESIGN,                 // 디자인/크리에이티브 (UX/UI, 그래픽, 일러스트)
    PLANNING_STRATEGY,      // 기획/전략/컨설팅 (PM, 전략기획, 컨설턴트)
    MARKETING,              // 마케팅/홍보/광고
    LAW,                    // 법조 (변호사·변리사·법무사·노무사)
    ACCOUNTING_TAX,         // 회계/세무 (회계사·세무사·감정평가사)
    RESEARCH,               // 연구/학술 (교수·연구원·R&D)
    MILITARY_POLICE,        // 군인/경찰/소방
    SALES,                  // 영업/세일즈/MD
    CONSTRUCTION_REALESTATE,// 건설/건축/부동산
    TRADE_LOGISTICS,        // 무역/물류
    ART_CULTURE,            // 예술/문화/스포츠 (배우·음악·작가·운동선수)
    STARTUP_BUSINESS,       // 사업/창업/자영업
    FREELANCE,              // 프리랜서
    STUDENT                 // 학생/취업준비
}

enum class IncomeRange {
    INCOME_RANGE_1, // 5000만원 이하
    INCOME_RANGE_2, // 5000~7500만원
    INCOME_RANGE_3, // 7500~9000만원
    INCOME_RANGE_4, // 9000~11000만원
    INCOME_RANGE_5  // 11000만원 이상
}
