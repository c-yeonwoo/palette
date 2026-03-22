package kr.ai.palette.persistence.ai

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface UserAiInsightJpaRepository : JpaRepository<UserAiInsightEntity, UUID>
