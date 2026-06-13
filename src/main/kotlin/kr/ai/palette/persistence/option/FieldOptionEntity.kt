package kr.ai.palette.persistence.option

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * 온보딩 칩 선택지(취향/서술형) — 어드민 동적 관리 (ADR 0057).
 *
 * 기존 JVM enum / 프론트 하드코딩 칩을 코드 테이블로 이관. set_key 로 묶이고
 * code(저장값) + label(표시) + 순서 + 활성/gender 로 구성.
 *
 * 하위호환: 프로필은 code 문자열을 그대로 저장하므로, 어드민이 옵션을 추가하면 즉시 사용 가능,
 * 삭제는 soft-delete(active=false) — 과거 프로필이 참조하는 code 의 label 해석이 끊기지 않는다.
 */
@Entity
@Table(
    name = "field_options",
    indexes = [Index(name = "idx_fo_set_order", columnList = "set_key, display_order")],
)
class FieldOptionEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    /** 옵션 묶음 (예: "bodyType","interests","personality","datePreference","importantValue","religion","appearanceStyle","dealBreaker","smoking","drinking") */
    @Column(name = "set_key", nullable = false, length = 40)
    var setKey: String,

    /** 저장값 (예: "SLIM" 또는 한글 자유 코드). 프로필에 이 값이 그대로 들어감 */
    @Column(name = "code", nullable = false, length = 80)
    var code: String,

    /** 화면 표시 라벨 (한글) */
    @Column(name = "label", nullable = false, length = 80)
    var label: String,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int,

    /** 성별 한정 옵션 (외모상 남/녀). null = 공통 */
    @Column(name = "gender", length = 10)
    var gender: String? = null,

    @Column(name = "active", nullable = false)
    var active: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
