# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Gradle wrapper + dependency cache layer
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts .
RUN ./gradlew dependencies --no-daemon -q

# Source
COPY src src
RUN ./gradlew bootJar -x test --no-daemon -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user
RUN addgroup -S palette && adduser -S palette -G palette
USER palette

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
# 메모리 옵션 — t3.small(2GB) 기준. ADR 0004 / 인시던트 2026-06-13(네이티브 스레드 고갈).
#  · MaxRAMPercentage 50: 힙을 ~1GB로 제한 → 스레드 스택·Metaspace·네이티브 버퍼용 여유 확보
#    (75%일 때 힙 1.5GB가 네이티브 메모리를 굶겨 "unable to create native thread" 유발)
#  · Xss512k: 스레드당 스택 1MB→512KB → 동일 메모리로 약 2배 스레드 여유
#  · ExitOnOutOfMemoryError: OOM 시 즉시 종료 → Docker restart:unless-stopped 로 자동 복구
#    (이전엔 JVM 이 OOM 을 잡고 행 상태로 연명 → 무중단 장애)
# 추가 footprint 최적화 (2026-06-13 메모리 다이어트, ADR 0053):
#  · UseSerialGC: 작은 힙·저 vCPU(t3.small)에선 G1 보다 네이티브 오버헤드/GC 스레드 수가 적다
#  · MaxMetaspaceSize 192m: 클래스 메타데이터 네이티브 무한 증식 차단
#  · TieredStopAtLevel=1: C1 전용 JIT → C2 컴파일러 스레드 제거 + 코드 캐시 축소 (베타엔 충분)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=50.0", \
  "-Xss512k", \
  "-XX:+ExitOnOutOfMemoryError", \
  "-XX:+UseSerialGC", \
  "-XX:MaxMetaspaceSize=192m", \
  "-XX:TieredStopAtLevel=1", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
