package kr.ai.palette.palettepick.persistence

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface PalettePickBatchRunJpaRepository : JpaRepository<PalettePickBatchRunEntity, UUID> {

    /** 최근 실행 N개 (최신순) — 어드민 대시보드 목록. */
    fun findAllByOrderByStartedAtDesc(pageable: Pageable): List<PalettePickBatchRunEntity>
}
