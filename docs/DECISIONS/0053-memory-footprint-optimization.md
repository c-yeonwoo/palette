# 0053 — 메모리 풋프린트 최적화 (베타 전 다이어트)

- **상태**: Accepted
- **결정일**: 2026-06-13
- **결정자**: ys.choi
- **선행**: ADR 0004 (prod swap/memory), 0052 (네이티브 스레드 고갈 핫픽스)

## 컨텍스트

ADR 0052 인시던트(네이티브 스레드 고갈) 직후, **베타 모집 전에** 근본적으로 메모리 여유를 확보하기로 함. 근본 문제는 **t3.small(2GB) 한 박스에 MySQL + Redis + Spring API + nginx 4개가 공존**하는데 거의 모든 설정이 개발 기본값(여유 가정)이라는 것.

메모리 분포(대략): API 힙+네이티브 ~1.2GB / MySQL ~0.4-0.5GB(이 중 performance_schema ~150-200MB) / Redis / nginx / OS. 합이 2GB를 넘겨 swap 의존 → 압박.

추가로 prod 에서도 `show-sql`·전 영역 `DEBUG` 로깅·`open-in-view`·H2 콘솔이 켜져 있어 CPU/메모리/디스크를 상시 낭비 (프로파일별 yml 이 없어 `application.yml` 단일 파일이 모든 환경에 적용).

## 결정

### 1. JVM (Dockerfile) — 네이티브 footprint
- `-XX:+UseSerialGC` — 작은 힙·저 vCPU(2)에서 G1 보다 GC 스레드 수·네이티브 오버헤드가 적음
- `-XX:MaxMetaspaceSize=192m` — 클래스 메타데이터 네이티브 무한 증식 차단
- `-XX:TieredStopAtLevel=1` — C1 전용 JIT → C2 컴파일러 스레드 제거 + 코드 캐시 축소
- (0052 에서 적용: MaxRAMPercentage 50, Xss512k, ExitOnOutOfMemoryError 유지)

### 2. application.yml — prod-safe 기본값 (로컬은 env 로 복구)
- `spring.jpa.show-sql: ${JPA_SHOW_SQL:false}` (was true) — SQL 문자열 생성·로깅 낭비 제거
- `spring.jpa.properties.hibernate.format_sql: false` (was true)
- `spring.jpa.open-in-view: false` (신규) — 요청 전체 동안 커넥션/세션 점유 안 함 → 커넥션·스레드 압박↓ (DDL+DTO 매퍼 구조라 lazy-init 위험 낮음, 통합 테스트 통과)
- `spring.h2.console.enabled: ${H2_CONSOLE_ENABLED:false}` (was true) — prod off (보안+메모리)
- 로깅 `kr.ai.palette: INFO`(env `LOG_LEVEL_APP`), `org.springframework.security: WARN`, `org.hibernate.SQL: WARN` (모두 DEBUG 였음, env override 가능)

### 3. docker-compose.server.yml — DB/Redis 내부 튜닝
- **MySQL** `command`: `--performance-schema=OFF`(~150-200MB 절약) `--innodb-buffer-pool-size=128M` `--max-connections=60`(앱은 Hikari 10) `--skip-name-resolve`
- **Redis** `--maxmemory 96mb --maxmemory-policy allkeys-lru` — refresh token 무한 증식 방지

## 기대 효과

- MySQL perf_schema off (~150-200MB) + GC/JIT 네이티브 절감(~50-100MB) + DEBUG 로깅 churn 제거 → **~250-350MB 여유 확보 + 스레드 수 감소**
- prod 로그가 INFO 로 줄어 디스크·I/O·로그 버퍼 절약

## 한계 / 후속

- **진짜 해법은 분리/상향**: DB를 별도 인스턴스(RDS 등)로 빼거나 **t3.medium(4GB)** 로 업그레이드. 본 다이어트는 모집 초기 트래픽까지의 시간을 버는 것.
- 모니터링/알람 부재(ADR 0052 후속)와 함께 모집 전 필수.
- `open-in-view: false` 는 직렬화 경로에서 lazy 연관을 건드리면 `LazyInitializationException` 가능 — 현재 DTO 매퍼 구조상 안전하나, 신규 엔드포인트 작성 시 주의.
- 프로파일별 yml(`application-prod.yml`)을 두지 않고 기본값을 prod-safe 로 둔 뒤 로컬을 env 로 여는 방식 채택 (현재 프로파일 인프라 부재 + 안전 기본값 우선).

## 검증

- `./gradlew test` BUILD SUCCESSFUL (open-in-view=false 에서 통합 테스트 통과)
- 배포 후 `docker stats` / 스레드 수 / health 곡선 관찰 예정
