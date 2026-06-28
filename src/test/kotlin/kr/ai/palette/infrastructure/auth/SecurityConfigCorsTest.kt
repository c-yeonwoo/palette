package kr.ai.palette.infrastructure.auth

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldContainAll
import io.kotest.matchers.collections.shouldNotContain
import io.kotest.matchers.shouldBe

/**
 * CORS 허용 origin 병합 회귀 테스트.
 *
 * 배경: prod 의 CORS_ALLOWED_ORIGINS 환경변수가 application-prod.properties 의
 *       cors.allowed-origins 를 override 하면서 네이티브(capacitor) origin 이 누락 →
 *       iOS 앱의 베타코드/핸드폰 인증 호출이 전부 403(Invalid CORS request) 차단됐던 버그.
 *       네이티브 origin 3개는 환경변수와 무관하게 항상 허용돼야 한다.
 */
class SecurityConfigCorsTest : DescribeSpec({
    describe("resolveAllowedOriginPatterns") {

        it("설정값에 네이티브 origin 이 없어도 capacitor/https/palette localhost 를 항상 포함한다") {
            // prod 의 실제 시나리오: 웹 도메인만 주입된 경우
            val result = SecurityConfig.resolveAllowedOriginPatterns(
                "https://www.palette.ai.kr,https://palette.ai.kr"
            )
            result shouldContainAll listOf(
                "capacitor://localhost",
                "https://localhost",
                "palette://localhost",
            )
            result shouldContainAll listOf("https://www.palette.ai.kr", "https://palette.ai.kr")
        }

        it("중복 origin 은 제거한다") {
            val result = SecurityConfig.resolveAllowedOriginPatterns(
                "capacitor://localhost,https://www.palette.ai.kr"
            )
            result.count { it == "capacitor://localhost" } shouldBe 1
        }

        it("빈/공백 토큰은 무시한다") {
            val result = SecurityConfig.resolveAllowedOriginPatterns(" , https://www.palette.ai.kr , ")
            result shouldNotContain ""
            result shouldContainAll listOf("https://www.palette.ai.kr", "capacitor://localhost")
        }

        it("설정값이 완전히 비어도 네이티브 origin 만큼은 보장한다") {
            val result = SecurityConfig.resolveAllowedOriginPatterns("")
            result shouldBe SecurityConfig.MANDATORY_NATIVE_ORIGINS
        }
    }
})
