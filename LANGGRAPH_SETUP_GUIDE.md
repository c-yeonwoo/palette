# LangGraph 프롬프트 관리 시스템 - 설정 가이드

## 📋 개요

AI 요약 및 프로필 생성을 위한 LangGraph 기반 프롬프트 관리 시스템이 구축되었습니다.

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│                  PromptManagementScreen.tsx                  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP REST API
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                Spring Boot Backend (Kotlin)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Presentation Layer: PromptController                 │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │ Application Layer: PromptManagementService           │   │
│  │                    PromptExecutionService            │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │ Domain Layer: PromptTemplate, PromptExecution        │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │ Persistence Layer: JPA Entities & Repositories       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Infrastructure: LangGraphAIService                   │   │
│  └────────────────────┬─────────────────────────────────┘   │
└───────────────────────┼──────────────────────────────────────┘
                        │ HTTP
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            LangGraph Python Service (FastAPI)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LangGraph Workflow:                                  │   │
│  │   validate → build → execute → END                   │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ OpenAI GPT-4 API                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 시작하기

### 1. 백엔드 서버 실행 (Spring Boot)

```bash
# Java 21 환경 설정
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home

# 백엔드 서버 시작
./gradlew bootRun
```

**서버 주소**: http://localhost:8080

### 2. LangGraph Python 서비스 실행

```bash
# 디렉토리 이동
cd langgraph-service

# 가상환경 생성 (처음 한 번만)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 OPENAI_API_KEY 설정

# 서비스 시작
python main.py
```

**서비스 주소**: http://localhost:8001

### 3. 프론트엔드 서버 실행 (React)

```bash
cd frontend

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 시작
npm run dev
```

**프론트엔드 주소**: http://localhost:3000

## 📁 구현된 파일 구조

### Backend (Kotlin/Spring Boot)

```
src/main/kotlin/kr/ai/palette/
├── domain/prompt/                    # 도메인 계층
│   ├── PromptId.kt                   # Value Object: 프롬프트 ID
│   ├── PromptExecutionId.kt          # Value Object: 실행 ID
│   ├── PromptCategory.kt             # Enum: 프롬프트 카테고리
│   ├── PromptStatus.kt               # Enum: 프롬프트 상태
│   ├── ExecutionStatus.kt            # Enum: 실행 상태
│   ├── PromptTemplate.kt             # Aggregate Root: 프롬프트 템플릿
│   ├── PromptExecution.kt            # Entity: 실행 이력
│   ├── PromptTemplateRepository.kt   # Repository 인터페이스
│   └── PromptExecutionRepository.kt  # Repository 인터페이스
│
├── persistence/prompt/               # 영속성 계층
│   ├── PromptTemplateEntity.kt       # JPA Entity
│   ├── PromptExecutionEntity.kt      # JPA Entity
│   ├── PromptTemplateMapper.kt       # Domain ↔ Entity 변환
│   ├── PromptExecutionMapper.kt      # Domain ↔ Entity 변환
│   ├── PromptTemplateJpaRepository.kt
│   ├── PromptExecutionJpaRepository.kt
│   ├── PromptTemplateRepositoryImpl.kt
│   └── PromptExecutionRepositoryImpl.kt
│
├── application/prompt/               # 애플리케이션 계층
│   ├── PromptManagementService.kt    # 프롬프트 관리 서비스
│   ├── PromptExecutionService.kt     # 프롬프트 실행 서비스
│   └── AIService.kt                  # AI 서비스 인터페이스
│
├── infrastructure/ai/                # 인프라 계층
│   ├── LangGraphAIService.kt         # LangGraph 연동 구현
│   └── RestClientConfig.kt           # HTTP 클라이언트 설정
│
└── presentation/prompt/              # 프레젠테이션 계층
    ├── PromptController.kt           # REST API 컨트롤러
    └── PromptDTOs.kt                 # Request/Response DTO
```

### LangGraph Service (Python)

```
langgraph-service/
├── main.py                # FastAPI 애플리케이션
├── requirements.txt       # Python 의존성
├── .env.example          # 환경 변수 템플릿
└── README.md             # 서비스 문서
```

### Frontend (React/TypeScript)

```
frontend/src/app/components/
└── PromptManagementScreen.tsx  # 프롬프트 관리 UI
```

## 🔌 API 엔드포인트

### Prompt Template Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prompts` | 프롬프트 생성 |
| GET | `/api/prompts` | 프롬프트 목록 조회 |
| GET | `/api/prompts/{id}` | 프롬프트 상세 조회 |
| PUT | `/api/prompts/{id}` | 프롬프트 수정 |
| POST | `/api/prompts/{id}/activate` | 프롬프트 활성화 |
| POST | `/api/prompts/{id}/archive` | 프롬프트 보관 |
| DELETE | `/api/prompts/{id}` | 프롬프트 삭제 |

### Prompt Execution

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prompts/{id}/execute` | 프롬프트 실행 |
| GET | `/api/prompts/{id}/executions` | 실행 이력 조회 |
| GET | `/api/executions/{executionId}` | 특정 실행 조회 |

### LangGraph Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | 헬스 체크 |
| POST | `/api/completion` | AI 완성 생성 |
| POST | `/api/profile-summary` | 프로필 요약 생성 |
| POST | `/api/ideal-type-analysis` | 이상형 분석 |

## 📝 사용 예시

### 1. 프롬프트 템플릿 생성

```bash
curl -X POST http://localhost:8080/api/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "프로필 요약 생성기",
    "description": "사용자 프로필을 분석하여 매력적인 요약을 생성",
    "category": "PROFILE_SUMMARY",
    "template": "사용자 정보:\n나이: {age}\n직업: {job}\n취미: {hobbies}\n\n매력적인 프로필 요약을 작성하세요.",
    "variables": ["age", "job", "hobbies"],
    "systemMessage": "당신은 데이팅 앱의 프로필 작성 전문가입니다.",
    "temperature": 0.7,
    "maxTokens": 500
  }'
```

### 2. 프롬프트 실행

```bash
curl -X POST http://localhost:8080/api/prompts/{promptId}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "age": "28",
      "job": "소프트웨어 엔지니어",
      "hobbies": "여행, 사진, 독서"
    }
  }'
```

### 3. 프론트엔드에서 사용

1. 로그인 후 마이페이지로 이동
2. "프롬프트 관리" 메뉴 클릭
3. "+ 새로 만들기" 버튼으로 프롬프트 생성
4. 프롬프트 선택 후 "실행" 버튼 클릭
5. 변수 값 입력 후 AI 응답 확인

## 🎨 프롬프트 카테고리

| Category | Description |
|----------|-------------|
| `PROFILE_SUMMARY` | 프로필 요약 생성 |
| `IDEAL_TYPE_ANALYSIS` | 이상형 분석 |
| `INTRODUCTION_ENHANCEMENT` | 자기소개 향상 |
| `COLOR_TYPE_RECOMMENDATION` | 색깔 타입 추천 (8가지 메타포) |
| `MATCH_REASON` | 매칭 추천 이유 |
| `INTERVIEW_QUESTION` | AI 인터뷰 질문 생성 |
| `GENERAL` | 일반 목적 |

## 🔧 환경 변수

### Spring Boot (application.properties)

```properties
# LangGraph Service URL
langgraph.service.url=http://localhost:8001
```

### LangGraph Service (.env)

```bash
# OpenAI API Key (필수)
OPENAI_API_KEY=your_openai_api_key_here

# Service Configuration
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8001

# LLM Configuration
DEFAULT_MODEL=gpt-4
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=1000
```

## 🗄️ 데이터베이스 스키마

### prompt_templates

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary Key |
| name | VARCHAR(200) | 프롬프트 이름 |
| description | VARCHAR(1000) | 설명 |
| category | VARCHAR(50) | 카테고리 (Enum) |
| template | TEXT | 프롬프트 템플릿 |
| variables | TEXT | 변수 목록 (JSON) |
| system_message | TEXT | 시스템 메시지 |
| temperature | DOUBLE | Temperature 값 |
| max_tokens | INT | 최대 토큰 수 |
| version | INT | 버전 |
| status | VARCHAR(20) | 상태 (DRAFT/ACTIVE/ARCHIVED) |
| created_at | DATETIME | 생성 일시 |
| updated_at | DATETIME | 수정 일시 |

### prompt_executions

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary Key |
| prompt_id | VARCHAR(36) | 프롬프트 ID (FK) |
| user_id | VARCHAR(36) | 사용자 ID |
| input | TEXT | 입력 데이터 (JSON) |
| output | TEXT | AI 응답 |
| tokens_used | INT | 사용된 토큰 수 |
| duration_ms | BIGINT | 소요 시간 (ms) |
| status | VARCHAR(20) | 상태 (SUCCESS/FAILED/TIMEOUT) |
| error_message | TEXT | 에러 메시지 |
| created_at | DATETIME | 실행 일시 |

## 🎯 다음 단계

### Phase 1: 기본 기능 완성
- [x] 도메인 모델 구현
- [x] Persistence 레이어 구현
- [x] Application 서비스 구현
- [x] REST API 구현
- [x] LangGraph 워크플로우 구현
- [x] 프론트엔드 UI 구현

### Phase 2: 프로필 생성 통합
- [ ] 프로필 등록 플로우에 AI 요약 통합
- [ ] 자기소개 향상 기능 추가
- [ ] 이상형 분석 자동 생성
- [ ] 색깔 타입 추천 알고리즘

### Phase 3: AI 인터뷰 시스템
- [ ] 대화형 인터뷰 플로우 구현
- [ ] 10-15개 질문 시퀀스 설계
- [ ] 답변 기반 프로필 자동 생성
- [ ] 인터뷰 이력 관리

### Phase 4: 고도화
- [ ] 프롬프트 버전 관리
- [ ] A/B 테스트 지원
- [ ] 프롬프트 성능 분석
- [ ] 토큰 사용량 최적화
- [ ] 캐싱 전략 구현

## ⚠️ 주의사항

1. **OpenAI API Key 필수**: LangGraph 서비스를 실행하려면 유효한 OpenAI API 키가 필요합니다.

2. **Java 21 필수**: 백엔드는 Java 21을 사용합니다. JAVA_HOME 환경 변수를 올바르게 설정하세요.

3. **포트 충돌**:
   - 백엔드: 8080
   - LangGraph: 8001
   - 프론트엔드: 3000

   해당 포트가 이미 사용 중이면 충돌이 발생할 수 있습니다.

4. **데이터베이스**: 현재 H2 인메모리 DB를 사용합니다. 서버 재시작 시 데이터가 초기화됩니다.

5. **프로덕션 배포**: 프로덕션 환경에서는:
   - MySQL 등 영구 DB 사용
   - API 키 보안 강화
   - Rate Limiting 구현
   - 로깅 및 모니터링 추가

## 📚 참고 문서

- [LangGraph 공식 문서](https://python.langchain.com/docs/langgraph)
- [OpenAI API 문서](https://platform.openai.com/docs)
- [Spring Boot 4.0 문서](https://spring.io/projects/spring-boot)
- [FastAPI 문서](https://fastapi.tiangolo.com)

## 🐛 트러블슈팅

### 백엔드 컴파일 에러
- Jackson import 에러: `tools.jackson` 패키지 사용 확인
- Java 버전 에러: Java 21 설치 및 JAVA_HOME 설정 확인

### LangGraph 서비스 에러
- `OPENAI_API_KEY not found`: .env 파일에 API 키 설정
- `Port already in use`: 8001 포트 사용 중인 프로세스 종료

### 프론트엔드 빌드 에러
- `npm install` 실패: Node.js 버전 확인 (v18+ 권장)
- UI 컴포넌트 에러: shadcn/ui 의존성 확인

## 💡 팁

1. **개발 모드 자동 리로드**:
   ```bash
   # LangGraph 서비스
   uvicorn main:app --reload
   ```

2. **프롬프트 템플릿 테스트**:
   - 먼저 DRAFT 상태로 생성
   - 테스트 실행으로 검증
   - 검증 완료 후 ACTIVE로 전환

3. **토큰 사용량 모니터링**:
   - 실행 이력에서 tokensUsed 확인
   - maxTokens 조정으로 비용 최적화

4. **에러 디버깅**:
   - 백엔드 로그: gradlew bootRun 출력 확인
   - LangGraph 로그: FastAPI 콘솔 출력 확인
   - 프론트엔드: 브라우저 개발자 도구 Network 탭

---

**구현 완료일**: 2026-01-20
**작성자**: Claude Code
**버전**: 1.0.0
