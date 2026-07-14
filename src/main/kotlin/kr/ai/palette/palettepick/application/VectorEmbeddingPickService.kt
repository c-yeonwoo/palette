package kr.ai.palette.palettepick.application

import org.springframework.stereotype.Service

/**
 * 벡터 유사도 Pick 스텁 (P2-001).
 * pgvector/Pinecone 연동 전 — 기존 PalettePickRecommendationService 오케스트레이터에 위임.
 */
@Service
class VectorEmbeddingPickService {
    /** Phase 3: introduction + idealType 텍스트 → embedding → cosine top-K */
    fun isVectorModeEnabled(): Boolean = false
}
