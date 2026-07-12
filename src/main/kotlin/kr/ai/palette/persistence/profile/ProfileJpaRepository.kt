package kr.ai.palette.persistence.profile

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface ProfileJpaRepository : JpaRepository<ProfileEntity, UUID> {
    fun findByUserId(userId: UUID): ProfileEntity?
    fun existsByUserId(userId: UUID): Boolean

    /**
     * 콜드스타트 공개 발견 풀 후보 조회 (ADR 0072).
     * 공개 노출 opt-in(null=기본 노출) + 매칭 받기 on + 숨김 아님 + 지정 시도(수도권).
     * 성별/활성 필터·거리 정렬은 앱 레벨(gender 는 users, 거리는 시군구 중심좌표).
     */
    @Query(
        """
        SELECT p.userId AS userId, p.sido AS sido, p.sigungu AS sigungu
        FROM ProfileEntity p
        WHERE (p.publicDiscoverable IS NULL OR p.publicDiscoverable = true)
          AND p.isAcceptingMatches = true
          AND p.hiddenAt IS NULL
          AND p.sido IN :sidos
        """
    )
    fun findPublicPoolCandidates(@Param("sidos") sidos: Collection<String>): List<PublicPoolCandidateRow>
}

/** 공개 풀 후보 프로젝션 — 거리 정렬용 최소 필드. */
interface PublicPoolCandidateRow {
    val userId: UUID
    val sido: String?
    val sigungu: String?
}
