package kr.ai.palette.infrastructure.seed

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.User
import kr.ai.palette.domain.user.UserRepository
import org.springframework.stereotype.Component

/**
 * 데모용 시드 유저(DevDataSeeder 가 만든) 와 일반 가입 유저를 구분.
 *
 * 정책:
 * - 시드 사용자 ↔ 시드 데이터: 보임 (테스트 계정끼리는 풍부한 데모 환경)
 * - 일반 신규 가입자 ↔ 시드 데이터: **격리** — 깨끗한 빈 상태에서 시작
 *
 * 식별 기준: email 도메인 / 패턴 (DevDataSeeder 에서 사용한 패턴과 일치)
 *   - dev@palette.kr               — 메인 dev 계정
 *   - user{1..12}@dev.palette.kr   — REGULAR 시드
 *   - mm{1..2}@dev.palette.kr      — MATCHMAKER 시드
 */
@Component
class SeedUserPolicy(
    private val userRepository: UserRepository,
) {

    fun isSeed(user: User): Boolean {
        val email = user.privateInfo.email ?: return false
        return email == DEV_EMAIL || email.endsWith(SEED_EMAIL_DOMAIN)
    }

    fun isSeed(userId: UserId): Boolean {
        val user = userRepository.findById(userId) ?: return false
        return isSeed(user)
    }

    /** 신규 가입자에게 시드 데이터를 노출해야 하는지 — 본인이 시드면 OK */
    fun shouldExposeSeedTo(viewer: User): Boolean = isSeed(viewer)

    /** 후보 user 컬렉션에서 시드 격리가 필요하면 시드 유저 제거 */
    fun filterSeedFor(viewer: User, candidateUserIds: Collection<UserId>): List<UserId> {
        if (shouldExposeSeedTo(viewer)) return candidateUserIds.toList()
        return candidateUserIds.filter { !isSeed(it) }
    }

    companion object {
        private const val DEV_EMAIL = "dev@palette.kr"
        private const val SEED_EMAIL_DOMAIN = "@dev.palette.kr"
    }
}
