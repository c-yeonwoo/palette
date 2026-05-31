# Generated SoT (자동 생성)

> 이 디렉토리의 파일은 **자동 생성**됩니다. 직접 수정하지 마세요.
> 워커도 이 디렉토리에 commit 안 함 (reviewer 가 차단).

---

## 파일

| 파일 | 출처 | 빌드 명령 |
|---|---|---|
| `api-spec.json` | springdoc-openapi `/v3/api-docs` | `./scripts/generate-api-spec.sh` |
| `api-spec.md` | 위 JSON → 마크다운 요약 | 위와 동일 |
| `db-schema.md` (TODO) | JPA Entity → mermaid ER | (BACKLOG — sot-generator 워커가 추가) |
| `domain-map.md` (TODO) | Aggregate 구조 → mermaid | (BACKLOG) |

---

## 사용

### 로컬에서 수동 빌드
```bash
# 1. 백엔드 실행 (다른 터미널)
SPRING_PROFILES_ACTIVE=local SERVER_PORT=8081 ./gradlew bootRun

# 2. 스펙 추출
./scripts/generate-api-spec.sh
```

### Swagger UI 로 보기 (대화형)
백엔드 실행 중일 때:
- http://localhost:8081/swagger-ui.html
- http://localhost:8081/v3/api-docs (raw JSON)

### CI 통합 (BACKLOG)
1. GitHub Actions 빌드 단계에서 `./scripts/generate-api-spec.sh` 호출
2. 결과 diff 가 main 과 다르면 `docs/generated/` 만 별도 commit
3. 또는 `sot-generator` Hermes 워커가 PR 머지 트리거로 자동 호출

---

## 룰

- 이 디렉토리에 사람/워커가 직접 commit 한 변경 → reviewer 가 차단 (`agent:needs_human`)
- `.gitattributes` 에서 `docs/generated/* linguist-generated=true` 설정 권장 (GitHub diff 접힘)
- spec 누락된 endpoint 가 발견되면 → 백엔드 컨트롤러에 `@Operation`/`@Tag` 어노테이션 보강

---

## springdoc 설정

기본 동작 — Spring Boot 가 컨트롤러 / DTO 자동 스캔. 추가 어노테이션 없이도 동작.

선택적 어노테이션 (가독성 ↑):
```kotlin
@Tag(name = "auth", description = "인증/회원가입")
@RestController
class AuthController(...) {

    @Operation(summary = "현재 사용자 조회")
    @GetMapping("/me")
    fun getCurrentUser(...) { ... }
}
```

→ 점진 추가. 필수 아님.
