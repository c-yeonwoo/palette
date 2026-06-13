package kr.ai.palette.presentation.onboarding

import kr.ai.palette.persistence.option.FieldOptionJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 온보딩 칩 옵션 조회 (ADR 0057) — 어드민이 관리하는 활성 옵션을 set_key 별로 내려준다.
 * 프론트 온보딩 화면이 하드코딩 칩 대신 이걸로 렌더.
 */
@RestController
@RequestMapping("/api/v1/onboarding")
class OnboardingOptionsController(
    private val repository: FieldOptionJpaRepository,
) {
    @GetMapping("/options")
    fun options(): ResponseEntity<OnboardingOptionsResponse> {
        val grouped = repository.findByActiveTrueOrderBySetKeyAscDisplayOrderAsc()
            .groupBy { it.setKey }
            .mapValues { (_, rows) -> rows.map { OptionDto(it.code, it.label, it.gender) } }
        return ResponseEntity.ok(OnboardingOptionsResponse(options = grouped))
    }
}

data class OptionDto(val code: String, val label: String, val gender: String?)
data class OnboardingOptionsResponse(val options: Map<String, List<OptionDto>>)
