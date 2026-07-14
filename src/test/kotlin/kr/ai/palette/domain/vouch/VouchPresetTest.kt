package kr.ai.palette.domain.vouch

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.shouldBe

class VouchPresetTest : DescribeSpec({
    describe("VouchPreset") {
        it("fromKey resolves known presets") {
            VouchPreset.fromKey("EASYGOING") shouldBe VouchPreset.EASYGOING
            VouchPreset.fromKey("SERIOUS")?.label shouldBe "진지해요"
        }

        it("fromKey returns null for blank or unknown") {
            VouchPreset.fromKey(null).shouldBeNull()
            VouchPreset.fromKey("").shouldBeNull()
            VouchPreset.fromKey("UNKNOWN").shouldBeNull()
        }
    }
})
