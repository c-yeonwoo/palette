package kr.ai.palette.persistence.ai

import org.springframework.data.jpa.repository.JpaRepository

interface ProfileGenerationCacheJpaRepository : JpaRepository<ProfileGenerationCacheEntity, String>
