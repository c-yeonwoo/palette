# 0004 — Prod EC2 Swap 추가 + 메모리 정책

- **상태**: Accepted, 적용 완료 (2026-05-30)
- **결정자**: ys.choi

## 컨텍스트

- prod EC2 인스턴스: **t3.small** (2 vCPU, 1.9GB RAM)
- 컨테이너 4개 동시 가동: api(453MB), db(376MB), redis(4MB), frontend(8MB)
- **Swap 0** — 작은 인스턴스 + 스왑 없음 조합
- 3일간 누적 **OOM 301건** (Hikari connection-closer native thread 생성 실패)
- root cause 는 별개로 SecurityConfig (`0002`) — 다만 OOM 도 안정성 위협이라 같이 처리

### Dockerfile 의 JVM 옵션
```dockerfile
ENTRYPOINT ["java",
  "-XX:+UseContainerSupport",
  "-XX:MaxRAMPercentage=75.0",
  ...]
```
- 컨테이너 mem_limit 미설정 → `MaxRAMPercentage=75` 가 호스트 메모리(1.9GB)의 75% (~1.4GB) 까지 heap 잡으려 시도
- thread stack (~1MB/thread) 할당 시 메모리 부족 → native thread 생성 실패 → Hikari leak

## 검토한 옵션

| 옵션 | 비용 | 효과 |
|---|---|---|
| **swap 2GB 추가** | 0원 | ✅ 즉시 효과, downtime 0, 재부팅 X |
| `docker-compose mem_limit: 1g` | 0원 | 보조적 — heap 상한 명확 |
| `MaxRAMPercentage` 75 → 50 | 0원 | 보조적 — heap 더 보수적 |
| EC2 t3.medium 업그레이드 (RAM 2배) | ~$30/월 | 근본 해결, 정식 출시 전 |

## 결정

**즉시 (적용 완료)**:
- prod EC2 에 swap 2GB 추가 (`/swapfile`)
- `/etc/fstab` 영구화: `/swapfile none swap sw 0 0`
- `vm.swappiness=10` — 디스크 I/O 최소화하면서 OOM 흡수
- `palette-api-1` 재시작 (leak connection 정리)

**미적용 — 후속 검토** (BACKLOG P1):
- `docker-compose.server.yml` 에 `api: mem_limit: 1g` 추가
- `Dockerfile` `MaxRAMPercentage` 75 → 50 (또는 `-Xmx512m` 고정)
- `application-prod.properties` 에 Hikari `maximum-pool-size: 5`, Tomcat `threads.max: 50`

## 룰 (이후)

- 운영 변경은 `docs/RUNBOOK.md` 동반 갱신
- EC2 인스턴스 사양 변경 시 ADR 추가
- swap 모니터링 — `vmstat 1` 또는 CloudWatch alarm (P2)

## 영향

- 누적 OOM: **3일간 301건 → 4시간 안정 가동 0건** ✅
- swap 사용량: 21MB / 2047MB (여유 충분)
- 컨테이너 상태 healthy 복귀

## 위험

- t3.small 의 디스크 (gp2) I/O 한계 — swap 사용량 급증 시 latency ↑
- 정식 출시 전 t3.medium 또는 t3.large 로 업그레이드 권장
