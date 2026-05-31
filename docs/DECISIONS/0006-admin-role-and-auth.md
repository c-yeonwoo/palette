# 0006 — Admin Role + 별도 로그인 + SPA 분기

- **상태**: Accepted
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

베타 운영을 위한 운영자 페이지(회원/매칭/CS/AI 비용 관리) 필요. 사용자 페이지와 분리하되, 같은 코드베이스/배포 단위에서 운영하는 구조 결정.

## 검토한 옵션

### 권한 모델
| 옵션 | 평가 |
|---|---|
| **A. `User.role` 컬럼 (USER/ADMIN)** | ✅ 단순. AccountType 과 별개 축. 마이그레이션 1줄 |
| B. 별도 `AdminUser` entity | over-engineer. 사용자/운영자 양쪽 가능한 사람 처리 복잡 |
| C. IP 화이트리스트만 | 사용자 컨피그 부담. 출장 시 막힘 |

### 로그인 경로
| 옵션 | 평가 |
|---|---|
| **a. 별도 `/api/v1/admin/auth/login`** | ✅ audit 분리, 실수 방지 (사용자가 admin endpoint 호출 시 명시적 403) |
| b. 같은 `/auth/email/login` + role 검사 | 코드 적지만 audit 흐려짐 |

### 프론트 분기
| 옵션 | 평가 |
|---|---|
| **i. SPA 안 pathname 분기 (`/admin`)** | ✅ 같은 배포 단위, nginx 추가 설정 없음. main.tsx 가 진입점 분기 |
| ii. 별도 서브도메인 `admin.palette.ai.kr` | 인증서/배포 추가 부담 |
| iii. 별도 build/배포 | 운영 복잡도 ↑↑ |

## 결정

**A + a + i** 채택.

### 백엔드
1. `UserRole` enum (USER, ADMIN) — `domain/user/`
2. `User.role` 필드 (기본 USER) — `domain/user/User.kt`
3. `UserEntity.role` 컬럼 — `persistence/user/UserEntity.kt`, `UserRoleEntity` enum
4. `UserMapper` 변환 — `toDomain`/`toEntity`/`updateEntity`
5. `schema-mysql.sql`: `role enum('USER','ADMIN') NOT NULL DEFAULT 'USER'`
6. `db/migration/V10__add_role_to_users.sql`: 기존 row 모두 `USER` backfill
7. `AuthUser.role` 필드 — `JwtAuthenticationFilter` 가 `SimpleGrantedAuthority("ROLE_" + role.name)` 부여
8. `SecurityConfig`: `/api/v1/admin/auth/login` permitAll, `/api/v1/admin/**` 는 `hasRole("ADMIN")` (이미 존재)
9. `AdminAuthController.POST /api/v1/admin/auth/login`:
   - role=ADMIN 만 통과
   - 일반 사용자 시도 시 400 (실수 방지 + audit)
   - JWT 발급 형식은 일반 로그인과 동일
10. `DevDataSeeder`: `admin@palette.kr` / `adminpass123` / role=ADMIN 시드
11. `SeedUserPolicy`: admin 이메일도 시드로 포함 (테스트 환경 일관성)

### 프론트
1. `main.tsx` — `window.location.pathname.startsWith("/admin")` 으로 진입점 분기
2. `app-admin/AdminApp.tsx` — pathname 기반 화면 전환 (login / dashboard)
3. `app-admin/lib/adminAuth.ts` — 사용자와 별도 storage key (`palette.admin.*`)
4. `app-admin/lib/adminApi.ts` — 별도 API client (401 시 `/admin/login` 으로)
5. `app-admin/components/AdminLoginScreen.tsx` — 별도 로그인 화면
6. `app-admin/components/AdminDashboardScreen.tsx` — KPI 카드 + 로그아웃 (현재는 placeholder, PR #4-#5 에서 확장)

### nginx (prod)
별도 설정 불필요. 같은 SPA 가 `/admin/*` 도 처리 (index.html fallback) — 현재 nginx 설정 이미 SPA-friendly.

## 영향

- 기존 `User` 생성 코드 (signup 등) 는 변경 없음 — `role` 이 default USER 라 빌드 호환
- `@AuthenticationPrincipal AuthUser` 사용 컨트롤러 모두 그대로 (role 필드 default 추가)
- JWT 토큰 형식 변경 없음 — 권한은 매 request 마다 user.role 로 결정
- prod 배포 시 `V10` 마이그레이션이 자동 적용 (현재 부트스트랩 흐름)

## 룰 (이후)

- `/api/v1/admin/**` 엔드포인트는 모두 `hasRole("ADMIN")` 매처 아래 (SecurityConfig 의 anyRequest authenticated 위에 명시)
- admin 계정 비밀번호 변경/추가는 별도 PR (직접 SQL 또는 별도 endpoint)
- ADMIN 계정도 일반 로그인 가능 — 단 권한은 user.role 로 결정 (토큰이 admin 토큰 아님)
- 추후 admin API 추가 시 `presentation/admin/` 디렉토리에 모음
- 프론트 `/admin/*` 라우트 추가 시 `app-admin/AdminApp.tsx` 의 pathname 분기 확장

## Follow-up

- PR #4: AdminDashboard + Users 화면 (회원 목록 / 차단 / 휴면)
- PR #5: Matchings + CS 화면
- BACKLOG: AI 사용 비용 추적 (별도 entity + 대시보드)
- BACKLOG: admin 작업 audit log (누가 누구를 차단했나 등)
- BACKLOG: 2FA 또는 IP 화이트리스트 추가 검토
