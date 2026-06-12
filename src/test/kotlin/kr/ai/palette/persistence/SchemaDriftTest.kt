package kr.ai.palette.persistence

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.Table
import org.springframework.core.io.ClassPathResource
import org.springframework.core.type.filter.AnnotationTypeFilter
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider

/**
 * 스키마 drift 가드 (ADR — drift 근본 대책 CI 검증).
 *
 * 목적: `@Entity` 의 모든 `@Column`/`@JoinColumn` 이 prod 부트스트랩 SQL
 *      (schema-mysql.sql + schema-mysql-migrations.sql) 에 존재하는지 빌드 타임 검증.
 *      누락 시 빌드 fail → prod 배포 후 "Unknown column" 500 (#34·#38·#39) 을 PR 단계에서 차단.
 *
 * 배경: prod 는 ddl-auto=none (Hibernate 7.2 + MySQL SEQUENCES 버그 우회) 라
 *      엔티티에 컬럼 추가해도 prod DB 에 자동 반영 안 됨. SQL 마이그레이션을 직접 갱신해야 함.
 *      이 테스트가 그 누락을 강제로 잡는다.
 *
 * 검사 방향: entity → schema (단방향). schema 에만 있고 entity 에 없는 컬럼은 무해하므로 무시.
 *
 * 신규 엔티티/컬럼 추가 절차:
 *   1. {Domain}Entity 에 @Column 추가
 *   2. schema-mysql-migrations.sql 에 ALTER TABLE ... ADD COLUMN (idempotent) 추가
 *   3. (신규 테이블이면) schema-mysql-migrations.sql 에 CREATE TABLE IF NOT EXISTS 추가
 *   4. 이 테스트 통과 확인
 */
class SchemaDriftTest : DescribeSpec({

    describe("스키마 drift — @Entity 컬럼이 부트스트랩 SQL 에 모두 존재해야 함") {

        it("모든 엔티티 @Column 이 schema SQL 에 정의됨") {
            val schemaColumns = parseSchemaColumns()
            val entities = scanEntities()

            val violations = mutableListOf<String>()

            for (entity in entities) {
                val table = entity.tableName
                val schemaCols = schemaColumns[table]
                if (schemaCols == null) {
                    violations += "테이블 '$table' (${entity.className}) 이 schema SQL 에 없음 — CREATE TABLE 추가 필요"
                    continue
                }
                for (col in entity.columns) {
                    if (col !in schemaCols) {
                        violations += "$table.$col (${entity.className}) — schema SQL 에 없음. " +
                            "schema-mysql-migrations.sql 에 ALTER TABLE $table ADD COLUMN $col ... 추가 필요"
                    }
                }
            }

            if (violations.isNotEmpty()) {
                val msg = buildString {
                    appendLine("스키마 drift 발견 — 엔티티 컬럼이 부트스트랩 SQL 에 누락:")
                    violations.sorted().forEach { appendLine("  · $it") }
                    appendLine()
                    appendLine("→ src/main/resources/db/schema-mysql-migrations.sql 에 누락 컬럼 ALTER 추가 후 재실행.")
                }
                throw AssertionError(msg)
            }

            violations.size shouldBe 0
        }
    }
})

// ─── 엔티티 스캔 ──────────────────────────────────────────────

private data class EntityMeta(
    val className: String,
    val tableName: String,
    val columns: Set<String>,
)

private fun scanEntities(): List<EntityMeta> {
    val scanner = ClassPathScanningCandidateComponentProvider(false)
    scanner.addIncludeFilter(AnnotationTypeFilter(Entity::class.java))
    val beanDefs = scanner.findCandidateComponents("kr.ai.palette")
    return beanDefs.mapNotNull { bd ->
        val clazz = Class.forName(bd.beanClassName)
        val table = clazz.getAnnotation(Table::class.java)
        // 모든 엔티티가 @Table(name) 보유 (audit 확인). 없으면 snake_case 추론.
        val tableName = table?.name?.takeIf { it.isNotBlank() } ?: camelToSnake(clazz.simpleName.removeSuffix("Entity"))

        val cols = mutableSetOf<String>()
        // 상속 포함 모든 필드 (BaseEntity 등 대비)
        var c: Class<*>? = clazz
        while (c != null && c != Any::class.java) {
            for (field in c.declaredFields) {
                val colAnno = field.getAnnotation(Column::class.java)
                if (colAnno != null) {
                    cols += colAnno.name.takeIf { it.isNotBlank() } ?: camelToSnake(field.name)
                    continue
                }
                val joinAnno = field.getAnnotation(JoinColumn::class.java)
                if (joinAnno != null) {
                    cols += joinAnno.name.takeIf { it.isNotBlank() } ?: camelToSnake(field.name)
                }
            }
            c = c.superclass
        }
        EntityMeta(clazz.simpleName, tableName, cols)
    }
}

// ─── SQL 파싱 ──────────────────────────────────────────────

private val CONSTRAINT_KEYWORDS = setOf(
    "primary", "foreign", "constraint", "unique", "key", "index", "engine", "create", "alter",
)

private fun parseSchemaColumns(): Map<String, MutableSet<String>> {
    val result = mutableMapOf<String, MutableSet<String>>()
    listOf("db/schema-mysql.sql", "db/schema-mysql-migrations.sql").forEach { path ->
        val res = ClassPathResource(path)
        if (!res.exists()) return@forEach
        val text = res.inputStream.bufferedReader().readText()
        parseInto(text, result)
    }
    return result
}

private fun parseInto(sql: String, into: MutableMap<String, MutableSet<String>>) {
    // CREATE TABLE [IF NOT EXISTS] <name> ( ... )
    val createRegex = Regex(
        """create\s+table\s+(?:if\s+not\s+exists\s+)?`?(\w+)`?\s*\((.*?)\)\s*engine""",
        setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL),
    )
    for (m in createRegex.findAll(sql)) {
        val table = m.groupValues[1].lowercase()
        val body = m.groupValues[2]
        val cols = into.getOrPut(table) { mutableSetOf() }
        body.lineSequence().forEach { rawLine ->
            val line = rawLine.trim().removePrefix("`")
            val firstToken = Regex("""^([a-z_][a-z0-9_]*)""").find(line)?.groupValues?.get(1)
            if (firstToken != null && firstToken.lowercase() !in CONSTRAINT_KEYWORDS) {
                cols += firstToken.lowercase()
            }
        }
    }

    // ALTER TABLE <name> ADD COLUMN <col>
    val alterRegex = Regex(
        """alter\s+table\s+`?(\w+)`?\s+add\s+column\s+`?(\w+)`?""",
        RegexOption.IGNORE_CASE,
    )
    for (m in alterRegex.findAll(sql)) {
        val table = m.groupValues[1].lowercase()
        val col = m.groupValues[2].lowercase()
        into.getOrPut(table) { mutableSetOf() } += col
    }
}

private fun camelToSnake(s: String): String =
    s.replace(Regex("([a-z0-9])([A-Z])"), "$1_$2").lowercase()
