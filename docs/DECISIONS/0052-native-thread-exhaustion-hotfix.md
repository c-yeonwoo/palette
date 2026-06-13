# 0052 — prod 네이티브 스레드 고갈 인시던트 + 메모리 핫픽스

- **상태**: Accepted (핫픽스)
- **결정일**: 2026-06-13
- **결정자**: ys.choi
- **선행**: ADR 0004 (prod swap/memory)

## 인시던트

베타 모집 준비 중 prod(`palette.ai.kr`) API 가 응답 불능. 증상:

- 정적 프론트(nginx)·DNS·TLS 는 정상 (`/`, `/actuator/*` 200)
- **`/api/**` 만 15초+ 타임아웃** (0바이트 응답)
- 컨테이너는 `restart: unless-stopped` + healthcheck 가 있었는데도 **자동 복구 안 됨**

`docker logs palette-api-1`:
```
java.lang.OutOfMemoryError: unable to create native thread:
  possibly out of memory or process/resource limits reached
  (HikariPool-1:connection-adder / connection-closer)
```
가동 ~20.7시간(74,536s) 시점부터 시작. 망가지는 게 Hikari 자잘한 housekeeping 스레드인 걸로 보아 **총 스레드 수가 OS/네이티브 한계에 도달**.

## 근본 원인

**힙 OOM 이 아니라 네이티브 메모리/스레드 고갈.** 세 요인의 조합:

| 요인 | 문제 |
|---|---|
| `Dockerfile: -XX:MaxRAMPercentage=75.0` | t3.small(2GB)에서 힙이 1.5GB → 스레드 스택·Metaspace·네이티브 버퍼에 ~0.5GB만 남음 |
| Tomcat 스레드 상한 미설정 (기본 200) | 부하/외부 호출 지연 시 워커가 늘며 각 ~1MB 스택 → 네이티브 메모리 한계 돌파 |
| die-fast 옵션 없음 | JVM 이 `OutOfMemoryError`(Error)를 잡고 **행 상태로 연명** → 프로세스가 안 죽으니 Docker `restart` 미작동. healthcheck 가 unhealthy 로 떨어져도 restart 정책은 프로세스 종료에만 반응 → 무중단 장애 |

## 결정 (핫픽스)

1. **Dockerfile JVM 옵션**
   - `MaxRAMPercentage` 75 → **50** (힙 ~1GB, 네이티브 여유 ~1GB 확보)
   - **`-Xss512k`** (스레드 스택 1MB→512KB, 동일 메모리로 ~2배 스레드 여유)
   - **`-XX:+ExitOnOutOfMemoryError`** (OOM 시 즉시 종료 → Docker 자동 재시작으로 self-heal)

2. **application.yml — 풀 상한 명시**
   - `server.tomcat.threads.max: 50` (+ min-spare 5, accept-count 100, max-connections 2000)
   - `spring.datasource.hikari`: maximum-pool-size 10, minimum-idle 2, connection-timeout 10s, max-lifetime 10m, keepalive 2m

3. **AsyncConfig — @Async executor 를 bounded 풀로 고정**
   - core 2 / max 4 / queue 100 / `CallerRunsPolicy` — baseline 스레드↓ + 무한 적체 방지 + 누수 진단 용이

## 즉시 복구

`docker restart palette-api-1` (≈30~60초). 누적 스레드 비워져 즉시 정상화. 핫픽스 배포(main → `deploy-prod.yml`) 후 재발 방지.

## 후속 (베타 모집 전 권장)

- **t3.small → t3.medium 업그레이드** (4GB) — 가장 근본적. 모집으로 트래픽 늘면 50 스레드도 빠듯
- 스레드 수 / 메모리 모니터링 + 알람 (RUNBOOK §4 알람 미구현 → CloudWatch 또는 Sentry)
- 부하/지속 테스트로 스레드 곡선이 평탄한지 확인 (누수 잔존 여부)
- `/actuator/health` 가 nginx SPA fallback 에 먹히지 않도록 외부 헬스 경로 점검 (현재 외부에선 actuator 직접 노출 안 됨)

## 결과

- 네이티브 메모리 여유 확보로 OOM 자체를 예방, 그래도 발생 시 die-fast → 자동 복구(수시간 장애 → ~1분 블립)
- 스레드/커넥션 상한이 명시되어 작은 박스에서 예측 가능
