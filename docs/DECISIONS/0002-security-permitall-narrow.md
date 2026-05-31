# 0002 — SecurityConfig permitAll 매처 좁힘

- **상태**: Accepted, 배포 완료 (PR #1)
- **결정일**: 2026-05-30
- **결정자**: ys.choi

## 컨텍스트

베타 운영 중 **누적 OOM 301건** + 회원가입 외 다수 API 500 발생. 진단 결과:

1. **표면적 원인**: 서버 메모리 고갈 (swap 0인 t3.small에서 JVM이 native thread stack 할당 실패)
2. **진짜 root cause (stacktrace)**:
   ```
   NullPointerException: Parameter specified as non-null is null:
     method kr.ai.palette.presentation.auth.AuthController.getCurrentUser, parameter authUser
   ```
   - `SecurityConfig.kt:45` 의 `/api/v1/auth/**` permitAll 매처가 너무 광범위
   - 인증 필수 endpoint (`/me`, `/logout`, `/account-type`, `/basic-info` 등)도 인증 없이 controller 도달
   - Kotlin non-null `@AuthenticationPrincipal AuthUser` 파라미터에 null 들어가 NPE
   - GlobalExceptionHandler 가 unhandled 로 잡아 500 반환
3. 토큰 만료 시점에 프론트가 호출하는 모든 인증 endpoint 가 500

## 검토한 옵션

| 옵션 | 평가 |
|---|---|
| `@AuthenticationPrincipal AuthUser?` (nullable) 로 변경 + null 체크 | 모든 controller 수정 필요, 의도 불명확 |
| **permitAll 매처를 인증 전 호출용으로만 좁힘** | ✅ 표면적 변경 최소, 의도 명확 |
| GlobalExceptionHandler 에 NPE 핸들러 추가 | 증상 가림, 근본 원인 그대로 |

## 결정

`/api/v1/auth/**` 광범위 매처 제거. 대신 인증 전 호출만:
- `/api/v1/auth/email/**` (signup, login, matchmaker/signup)
- `/api/v1/auth/refresh` (access token 만료 시 refresh token 만으로 호출)
- `/api/v1/auth/beta-code/**` (회원가입 전 베타 게이트 — 후속 추가)

나머지 `/api/v1/auth/*` (`/me`, `/logout`, `/account-type` 등) 는 `anyRequest().authenticated()` 로 떨어져 정상 401 반환.

## 룰 (이후)

- **permitAll 매처에 와일드카드 `**` 추가는 ADR 필수** — `@AuthenticationPrincipal AuthUser` 가 한 곳이라도 그 path 아래에 있으면 NPE 위험
- 매처 변경은 `docs/ARCHITECTURE.md §5.1` 갱신 동반
- 새 컨트롤러가 기존 와일드카드에 잡히는지 reviewer 가 체크

## 영향

- prod 배포 후 `/api/v1/auth/me` → **401** (이전: 500), 회귀 없음
- 부수 운영 조치: swap 2GB 추가, vm.swappiness=10 (`docs/DECISIONS/0004-prod-swap.md` 참조)
- 누적 OOM 0건으로 안정

## 미적용 follow-up

- ShareLinkController 의 `/api/v1/share/*` 매처도 같은 패턴이 있었음 → 같은 ADR 정신으로 `/share/v/*` 만 permitAll 하도록 fix 완료 (PR 별도)
