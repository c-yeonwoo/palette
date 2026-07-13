package kr.ai.palette.domain.profile

data class LocationInfo(
    val sido: String?,
    val sigungu: String?,
    // 근무지 (선택) — 고향 대체. sido→sigungu 캐스케이드 동일.
    val workSido: String? = null,
    val workSigungu: String? = null,
)
