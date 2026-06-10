package kr.ai.palette.palettepick

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.ints.shouldBeInRange
import io.kotest.matchers.shouldBe
import kr.ai.palette.palettepick.domain.PalettePickScore
import kr.ai.palette.palettepick.persistence.ProfileEmbeddingEntity

class PalettePickScoreTest : DescribeSpec({

    describe("PalettePickScore weighted total — ADR 0047 §B.3") {

        it("4축 max 일 때 총점 100") {
            val score = PalettePickScore(
                mutualIdealFit = 1.0,
                introSimilarity = 1.0,
                colorCompatibility = 1.0,
                momentum = 1.0,
            )
            score.total shouldBe 100
        }

        it("mutualIdealFit 만 만점, 나머지 0 → 50") {
            val score = PalettePickScore(mutualIdealFit = 1.0)
            score.total shouldBe 50
        }

        it("mutualIdealFit 0 (짝사랑 페널티) — 다른 축 모두 만점이어도 50 캡") {
            val score = PalettePickScore(
                mutualIdealFit = 0.0,
                introSimilarity = 1.0,
                colorCompatibility = 1.0,
                momentum = 1.0,
            )
            // 15 + 20 + 15 = 50
            score.total shouldBe 50
        }

        it("음수·과대 입력은 0..100 clamp") {
            val high = PalettePickScore(
                mutualIdealFit = 2.0,
                introSimilarity = 2.0,
                colorCompatibility = 2.0,
                momentum = 2.0,
            )
            high.total shouldBe 100
        }

        it("일반적 추천 후보 (0.6, 0.5, 0.75, 0.7) → 합리적 범위") {
            val score = PalettePickScore(
                mutualIdealFit = 0.6,
                introSimilarity = 0.5,
                colorCompatibility = 0.75,
                momentum = 0.7,
            )
            // 30 + 7.5 + 15 + 10.5 = 63
            score.total shouldBe 63
        }
    }

    describe("ProfileEmbeddingEntity pack/unpack roundtrip") {

        it("float[1536] → byte[6144] → float[1536] 동일") {
            val vec = FloatArray(ProfileEmbeddingEntity.DIMENSION) { i -> (i % 100) / 100f - 0.5f }
            val packed = ProfileEmbeddingEntity.pack(vec)
            packed.size shouldBe ProfileEmbeddingEntity.DIMENSION * 4
            val unpacked = ProfileEmbeddingEntity.unpack(packed)
            for (i in 0 until ProfileEmbeddingEntity.DIMENSION) {
                unpacked[i] shouldBe vec[i]
            }
        }

        it("코사인 유사도 — 동일 벡터 → 1.0") {
            val vec = FloatArray(ProfileEmbeddingEntity.DIMENSION) { 1f / kotlin.math.sqrt(ProfileEmbeddingEntity.DIMENSION.toFloat()) }
            val cos = ProfileEmbeddingEntity.cosineSimilarity(vec, vec)
            (cos * 1000).toInt().shouldBeInRange(995..1005) // ≈ 1.0
        }

        it("코사인 유사도 — 직교 벡터 → 0") {
            val a = FloatArray(ProfileEmbeddingEntity.DIMENSION).also { it[0] = 1f }
            val b = FloatArray(ProfileEmbeddingEntity.DIMENSION).also { it[1] = 1f }
            val cos = ProfileEmbeddingEntity.cosineSimilarity(a, b)
            cos shouldBe 0f
        }
    }
})
