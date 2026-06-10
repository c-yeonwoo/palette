package kr.ai.palette.palettepick.persistence

import jakarta.persistence.*
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.time.Instant

/**
 * 프로필 임베딩 캐시 — 팔레트픽 양방향 매칭 (ADR 0047 §B.3a).
 *
 * 자기소개와 이상형은 서로 다른 의미공간이라 **벡터를 분리 저장**.
 *  · intro_embedding  — "나는 어떤 사람인가" (자기소개 + 인터뷰 답변 + 관심사)
 *  · ideal_embedding  — "내가 원하는 사람" (이상형 정보의 자연어 prompt)
 *
 * 매칭 계산:
 *  · 상호 이상형 적합도 = cos(A.ideal, B.intro) × cos(B.ideal, A.intro)
 *  · 자기소개 유사도    = cos(A.intro, B.intro)
 *
 * 모델: OpenAI text-embedding-3-small (1,536 차원, $0.020/1M tokens)
 * 저장: 1,536 floats × 4 bytes = 6KB/벡터, columnDefinition = LONGBLOB.
 *
 * 갱신 트리거: Profile.metadata.updatedAt > this.updatedAt — async re-embed.
 */
@Entity
@Table(name = "profile_embeddings")
class ProfileEmbeddingEntity(
    @Id
    @Column(name = "user_id", nullable = false, columnDefinition = "BINARY(16)")
    val userId: java.util.UUID,

    /** 자기소개 임베딩 — 1,536 floats packed little-endian (≈ 6KB) */
    @Lob
    @Column(name = "intro_embedding", nullable = false, columnDefinition = "LONGBLOB")
    var introEmbedding: ByteArray,

    /** 이상형 임베딩 — 동일 차원 */
    @Lob
    @Column(name = "ideal_embedding", nullable = false, columnDefinition = "LONGBLOB")
    var idealEmbedding: ByteArray,

    /** 임베딩 모델 (변경 시 전체 재임베딩 필요) */
    @Column(name = "model", nullable = false, length = 32)
    var model: String,

    /** 자기소개 텍스트 hash — 동일 텍스트면 재임베딩 스킵 */
    @Column(name = "intro_hash", nullable = false, length = 64)
    var introHash: String,

    @Column(name = "ideal_hash", nullable = false, length = 64)
    var idealHash: String,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
) {
    companion object {
        const val DIMENSION = 1536

        /** float[1536] → byte[6144] little-endian. */
        fun pack(vec: FloatArray): ByteArray {
            require(vec.size == DIMENSION) { "벡터 차원 ${DIMENSION} 필요, 실제 ${vec.size}" }
            val buf = ByteBuffer.allocate(DIMENSION * 4).order(ByteOrder.LITTLE_ENDIAN)
            vec.forEach { buf.putFloat(it) }
            return buf.array()
        }

        /** byte[6144] → float[1536]. */
        fun unpack(bytes: ByteArray): FloatArray {
            require(bytes.size == DIMENSION * 4) { "바이트 길이 ${DIMENSION * 4} 필요, 실제 ${bytes.size}" }
            val buf = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
            val out = FloatArray(DIMENSION)
            for (i in 0 until DIMENSION) out[i] = buf.float
            return out
        }

        /**
         * 두 벡터 코사인 유사도 (-1..1).
         * 임베딩은 일반적으로 normalized (norm=1) → 단순 dot product = cosine.
         * OpenAI embeddings 는 normalized 라 dot product 만으로 OK.
         */
        fun cosineSimilarity(a: FloatArray, b: FloatArray): Float {
            require(a.size == b.size) { "벡터 차원 불일치: ${a.size} vs ${b.size}" }
            var dot = 0.0
            for (i in a.indices) dot += a[i] * b[i]
            // OpenAI normalized 라 norm 분모 1 으로 가정. 안전마진으로 norm 계산은 생략.
            return dot.toFloat()
        }
    }
}
