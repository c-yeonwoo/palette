plugins {
	kotlin("jvm") version "2.2.21"
	kotlin("plugin.spring") version "2.2.21"
	id("org.springframework.boot") version "4.0.1"
	id("io.spring.dependency-management") version "1.1.7"
	kotlin("plugin.jpa") version "2.2.21"
}

group = "kr.ai"
version = "0.0.1-SNAPSHOT"
description = "A friend-network dating app where trust meets connection"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-h2console")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-cache")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-restclient")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-security-oauth2-authorization-server")
	implementation("org.springframework.boot:spring-boot-starter-security-oauth2-client")
	implementation("org.springframework.boot:spring-boot-starter-webmvc")
	implementation("org.jetbrains.kotlin:kotlin-reflect")
	implementation("tools.jackson.module:jackson-module-kotlin")

	// JWT
	implementation("io.jsonwebtoken:jjwt-api:0.12.6")
	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

	// AWS S3 (S3Presigner는 s3 모듈에 포함)
	implementation(platform("software.amazon.awssdk:bom:2.20.26"))
	implementation("software.amazon.awssdk:s3")

	// Firebase Admin SDK (FCM)
	implementation("com.google.firebase:firebase-admin:9.4.3")

	// Redis (Refresh Token 저장)
	implementation("org.springframework.boot:spring-boot-starter-data-redis")

	// OpenAPI 자동 문서화 (SoT generator — docs/generated/api-spec.md 빌드용)
	// 런타임에 /v3/api-docs 노출, build 시 추출
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")

	runtimeOnly("com.h2database:h2")
	// MySQL Connector — 8.4 LTS 로 고정
	// 9.x는 Hibernate 7.x와 호환성 이슈 (SEQUENCES 테이블 조회 실패)
	runtimeOnly("com.mysql:mysql-connector-j:8.4.0")
	annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")
	testImplementation("org.springframework.boot:spring-boot-starter-actuator-test")
	testImplementation("org.springframework.boot:spring-boot-starter-cache-test")
	testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
	testImplementation("org.springframework.boot:spring-boot-starter-restclient-test")
	testImplementation("org.springframework.boot:spring-boot-starter-security-oauth2-authorization-server-test")
	testImplementation("org.springframework.boot:spring-boot-starter-security-oauth2-client-test")
	testImplementation("org.springframework.boot:spring-boot-starter-security-test")
	testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
	testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

	// Kotest
	testImplementation("io.kotest:kotest-runner-junit5:5.8.0")
	testImplementation("io.kotest:kotest-assertions-core:5.8.0")
	testImplementation("io.kotest:kotest-property:5.8.0")

	// MockK
	testImplementation("io.mockk:mockk:1.13.10")
}

kotlin {
	compilerOptions {
		freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
	}
}

allOpen {
	annotation("jakarta.persistence.Entity")
	annotation("jakarta.persistence.MappedSuperclass")
	annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
	useJUnitPlatform()
}
