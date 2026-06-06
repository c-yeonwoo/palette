package kr.ai.palette.domain.profile

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import java.time.Instant

class ProfileSettingsTest : DescribeSpec({
    describe("ProfileSettings.canReceiveMatches (어뷰징/프라이버시 가드 — ADR 0022)") {
        context("소개/주선 받기 on + 숨김 아님") {
            it("매칭 후보로 노출 가능하다") {
                ProfileSettings(isAcceptingMatches = true, hiddenAt = null)
                    .canReceiveMatches() shouldBe true
            }
        }
        context("주선 받기 off") {
            it("매칭 후보에서 제외된다") {
                ProfileSettings(isAcceptingMatches = false, hiddenAt = null)
                    .canReceiveMatches() shouldBe false
            }
        }
        context("프로필 숨김(hiddenAt 설정)") {
            it("받기 on 이어도 후보에서 제외된다") {
                ProfileSettings(isAcceptingMatches = true, hiddenAt = Instant.now())
                    .canReceiveMatches() shouldBe false
            }
        }
        context("둘 다 off") {
            it("후보에서 제외된다") {
                ProfileSettings(isAcceptingMatches = false, hiddenAt = Instant.now())
                    .canReceiveMatches() shouldBe false
            }
        }
        context("initial() 기본값") {
            it("기본은 매칭 후보로 노출 가능하다") {
                ProfileSettings.initial().canReceiveMatches() shouldBe true
            }
        }
    }
})
