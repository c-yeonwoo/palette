package kr.ai.palette.persistence.ai

import org.springframework.data.jpa.repository.JpaRepository

interface ColorReportCacheJpaRepository : JpaRepository<ColorReportCacheEntity, String>
