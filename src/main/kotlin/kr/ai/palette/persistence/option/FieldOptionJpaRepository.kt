package kr.ai.palette.persistence.option

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface FieldOptionJpaRepository : JpaRepository<FieldOptionEntity, UUID> {
    fun findByActiveTrueOrderBySetKeyAscDisplayOrderAsc(): List<FieldOptionEntity>
    fun findBySetKeyOrderByDisplayOrderAsc(setKey: String): List<FieldOptionEntity>
    fun findAllByOrderBySetKeyAscDisplayOrderAsc(): List<FieldOptionEntity>
    fun existsBySetKeyAndCodeAndGender(setKey: String, code: String, gender: String?): Boolean
}
