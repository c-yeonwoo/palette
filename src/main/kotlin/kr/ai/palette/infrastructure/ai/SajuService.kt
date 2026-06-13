package kr.ai.palette.infrastructure.ai

import org.springframework.stereotype.Service
import java.time.LocalDate

/**
 * 생년월일 기반 **결정적** 사주(오행) 요약 — ADR 0056.
 *
 * 음력/만세력 라이브러리 없이 간지(干支) 공식으로 계산한다. 출생시간(시주)·절기 정밀도는
 * 다루지 않으므로 정통 명리 수준은 아니고, 색깔 분석에 곁들이는 'flavor' 신뢰 신호 수준이다.
 *  · 연주(年柱): (year-4) mod 10/12 — 입춘(~2/4) 이전 출생은 전년으로 보정. (1984=갑자년 검증)
 *  · 일주(日柱): epochDay 기준 60갑자 (anchor 2000-01-07=甲子). 결정적.
 *  · 월지(月支): 양력 월 근사(절기 일 단위 정밀도 생략).
 * 오행은 연/일 천간·지지 + 월지에서 집계한다.
 */
@Service
class SajuService {

    fun analyze(birthDate: LocalDate): SajuResult {
        // ── 연주: 입춘 이전이면 전년 ──
        val sajuYear =
            if (birthDate.monthValue < 2 || (birthDate.monthValue == 2 && birthDate.dayOfMonth < 4)) birthDate.year - 1
            else birthDate.year
        val yStem = ((sajuYear - 4) % 10 + 10) % 10
        val yBranch = ((sajuYear - 4) % 12 + 12) % 12

        // ── 일주: 60갑자 (anchor 2000-01-07 = 甲子(0)) ──
        val dayGapja = (((birthDate.toEpochDay() - ANCHOR_GAPJA_EPOCH) % 60 + 60) % 60).toInt()
        val dStem = dayGapja % 10
        val dBranch = dayGapja % 12

        // ── 월지(양력 월 근사): Dec→자, Jan→축, Feb→인 ... ──
        val mBranch = birthDate.monthValue % 12

        // ── 오행 집계 (연 천간·지지 + 일 천간·지지 + 월지) ──
        val counts = linkedMapOf("목" to 0, "화" to 0, "토" to 0, "금" to 0, "수" to 0)
        listOf(
            STEM_ELEMENT[yStem], BRANCH_ELEMENT[yBranch],
            STEM_ELEMENT[dStem], BRANCH_ELEMENT[dBranch],
            BRANCH_ELEMENT[mBranch],
        ).forEach { counts[it] = (counts[it] ?: 0) + 1 }

        val dominant = counts.maxByOrNull { it.value }!!.key
        val lacking = counts.filter { it.value == 0 }.keys.toList()
        val dayMasterElement = STEM_ELEMENT[dStem]

        val distText = counts.entries.joinToString(" ") { "${it.key}${it.value}" }
        val summary = buildString {
            append("${sajuYear}년생(띠: ${ANIMALS[yBranch]}). ")
            append("일간 ${STEMS[dStem]}(${dayMasterElement} 기운). ")
            append("오행 분포 — $distText. ")
            append("가장 강한 기운: $dominant(${ELEMENT_TRAIT[dominant]}).")
            if (lacking.isNotEmpty()) append(" 부족한 기운: ${lacking.joinToString(", ")}.")
        }

        return SajuResult(
            yearStem = STEMS[yStem],
            yearBranch = BRANCHES[yBranch],
            animal = ANIMALS[yBranch],
            dayStem = STEMS[dStem],
            dayBranch = BRANCHES[dBranch],
            dayMasterElement = dayMasterElement,
            elementCounts = counts,
            dominant = dominant,
            lacking = lacking,
            summary = summary,
        )
    }

    data class SajuResult(
        val yearStem: String,
        val yearBranch: String,
        val animal: String,
        val dayStem: String,
        val dayBranch: String,
        /** 일간 오행 (목/화/토/금/수) — 사주에서 '나' 자신을 상징 */
        val dayMasterElement: String,
        val elementCounts: Map<String, Int>,
        val dominant: String,
        val lacking: List<String>,
        /** LLM 프롬프트·UI 에 넣을 한국어 한 줄 요약 */
        val summary: String,
    )

    companion object {
        // 2000-01-07 = 甲子일(0) anchor 의 epochDay
        private val ANCHOR_GAPJA_EPOCH = LocalDate.of(2000, 1, 7).toEpochDay()

        private val STEMS = listOf("갑", "을", "병", "정", "무", "기", "경", "신", "임", "계")
        private val BRANCHES = listOf("자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해")
        private val ANIMALS = listOf("쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지")
        // 천간 오행: 갑을=목, 병정=화, 무기=토, 경신=금, 임계=수
        private val STEM_ELEMENT = listOf("목", "목", "화", "화", "토", "토", "금", "금", "수", "수")
        // 지지 오행: 자=수, 축=토, 인·묘=목, 진=토, 사·오=화, 미=토, 신·유=금, 술=토, 해=수
        private val BRANCH_ELEMENT = listOf("수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수")
        // 오행 → 성향 키워드 (LLM 이 색깔로 매핑할 때 참고)
        private val ELEMENT_TRAIT = mapOf(
            "목" to "성장·온화·관계지향",
            "화" to "열정·표현·활발",
            "토" to "안정·신뢰·포용",
            "금" to "원칙·이성·단단함",
            "수" to "지혜·유연·깊이",
        )
    }
}
