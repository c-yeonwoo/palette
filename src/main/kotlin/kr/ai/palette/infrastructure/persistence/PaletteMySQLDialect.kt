package kr.ai.palette.infrastructure.persistence

import org.hibernate.dialect.MySQLDialect
import org.hibernate.dialect.sequence.NoSequenceSupport
import org.hibernate.dialect.sequence.SequenceSupport
import org.hibernate.tool.schema.extract.internal.SequenceInformationExtractorNoOpImpl
import org.hibernate.tool.schema.extract.spi.SequenceInformationExtractor

/**
 * Hibernate 7.2 + MySQL 호환성 우회 Dialect.
 *
 * 문제:
 *  - MySQLDialect가 supportsSequences=false 라고 선언하지만
 *  - DatabaseInformationImpl.initializeSequences() 가 이 플래그를 제대로 안 보고
 *    기본 SequenceInformationExtractorLegacyImpl을 호출
 *  - Legacy 추출기가 "select * from information_schema.SEQUENCES" 실행
 *  - MySQL은 SEQUENCES 테이블이 없어서 SQL 에러 → Spring Boot 부팅 실패
 *
 * 해결:
 *  - getSequenceInformationExtractor() 를 명시적으로 NoOp 으로 override
 *  - 더 이상 SEQUENCES 조회 안 함 → 부팅 정상
 *
 * application-prod.properties:
 *   spring.jpa.database-platform=kr.ai.palette.infrastructure.persistence.PaletteMySQLDialect
 */
class PaletteMySQLDialect : MySQLDialect() {

    override fun getSequenceSupport(): SequenceSupport = NoSequenceSupport.INSTANCE

    override fun getSequenceInformationExtractor(): SequenceInformationExtractor =
        SequenceInformationExtractorNoOpImpl.INSTANCE
}
