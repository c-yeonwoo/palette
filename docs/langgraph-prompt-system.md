# LangGraph Prompt Management System

## 개요
AI 요약 및 프로필 생성을 위한 프롬프트를 LangGraph를 사용하여 관리하는 시스템입니다.

## 시스템 아키텍처

```
┌─────────────────┐
│  Frontend UI    │
│  (React)        │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│ REST API        │
│ (Spring Boot)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ Domain Layer    │◄─────┤  LangGraph       │
│ (Prompt)        │      │  Workflow        │
└────────┬────────┘      └──────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│ Persistence     │      │  OpenAI API      │
│ (Database)      │      │  (GPT-4)         │
└─────────────────┘      └──────────────────┘
```

## 도메인 모델

### 1. PromptTemplate (프롬프트 템플릿)
```kotlin
data class PromptTemplate(
    val id: PromptId,
    val name: String,
    val description: String,
    val category: PromptCategory, // PROFILE_SUMMARY, IDEAL_TYPE_ANALYSIS, etc.
    val template: String,
    val variables: List<String>,
    val systemMessage: String?,
    val temperature: Double,
    val maxTokens: Int,
    val version: Int,
    val status: PromptStatus, // DRAFT, ACTIVE, ARCHIVED
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)
```

### 2. PromptExecution (실행 이력)
```kotlin
data class PromptExecution(
    val id: PromptExecutionId,
    val promptId: PromptId,
    val userId: UserId,
    val input: Map<String, Any>,
    val output: String,
    val tokensUsed: Int,
    val durationMs: Long,
    val status: ExecutionStatus, // SUCCESS, FAILED, TIMEOUT
    val error: String?,
    val createdAt: LocalDateTime
)
```

## LangGraph 워크플로우

### AI 요약 워크플로우
```
START
  │
  ├─► Load Prompt Template
  │
  ├─► Validate Input Variables
  │
  ├─► Build Prompt (inject variables)
  │
  ├─► Call OpenAI API
  │
  ├─► Parse Response
  │
  ├─► Save Execution History
  │
  └─► Return Result
END
```

### 상태 그래프 정의
```python
from langgraph.graph import StateGraph, END

workflow = StateGraph()

# Nodes
workflow.add_node("load_prompt", load_prompt_template)
workflow.add_node("validate", validate_input)
workflow.add_node("build", build_prompt)
workflow.add_node("execute", call_openai)
workflow.add_node("save", save_execution)

# Edges
workflow.add_edge("load_prompt", "validate")
workflow.add_conditional_edges(
    "validate",
    lambda x: "build" if x["valid"] else END
)
workflow.add_edge("build", "execute")
workflow.add_edge("execute", "save")
workflow.add_edge("save", END)

workflow.set_entry_point("load_prompt")
```

## API 엔드포인트

### Prompt Template Management
- `POST /api/prompts` - 프롬프트 생성
- `GET /api/prompts` - 프롬프트 목록
- `GET /api/prompts/{id}` - 프롬프트 조회
- `PUT /api/prompts/{id}` - 프롬프트 수정
- `DELETE /api/prompts/{id}` - 프롬프트 삭제 (ARCHIVED로 변경)

### Prompt Execution
- `POST /api/prompts/{id}/execute` - 프롬프트 실행
- `GET /api/prompts/{id}/executions` - 실행 이력 조회
- `GET /api/executions/{id}` - 특정 실행 조회

## 사용 예시

### 1. 프로필 요약 프롬프트
```json
{
  "name": "Profile Summary Generator",
  "category": "PROFILE_SUMMARY",
  "template": "사용자 프로필을 분석하여 매력적인 요약을 작성하세요.\n\n나이: {age}\n직업: {job}\n취미: {hobbies}\n성격: {personality}\n\n요약:",
  "variables": ["age", "job", "hobbies", "personality"],
  "systemMessage": "당신은 데이팅 앱의 프로필 작성 전문가입니다.",
  "temperature": 0.7,
  "maxTokens": 500
}
```

### 2. 프롬프트 실행
```json
POST /api/prompts/123/execute
{
  "input": {
    "age": "28",
    "job": "소프트웨어 엔지니어",
    "hobbies": "여행, 사진, 독서",
    "personality": "외향적이고 호기심 많은"
  }
}

Response:
{
  "executionId": "exec-456",
  "output": "28세 소프트웨어 엔지니어로, 여행과 사진을 통해 세상을 기록하는 것을 즐깁니다...",
  "tokensUsed": 287,
  "durationMs": 1523
}
```

## 구현 계획

### Phase 1: 기본 구조
1. Domain 모델 구현 (PromptTemplate, PromptExecution)
2. Repository 인터페이스 및 구현
3. 기본 CRUD API 구현

### Phase 2: LangGraph 통합
1. Python LangGraph 서비스 구축
2. Spring Boot에서 Python 서비스 호출 (HTTP/gRPC)
3. 워크플로우 실행 및 결과 저장

### Phase 3: AI 통합
1. OpenAI API 연동
2. 프롬프트 템플릿 최적화
3. 토큰 사용량 모니터링

### Phase 4: 프론트엔드 UI
1. 프롬프트 관리 화면
2. 실행 이력 조회
3. 실시간 AI 요약 테스트

## 기술 스택
- **Backend**: Kotlin + Spring Boot
- **AI Workflow**: Python + LangGraph + LangChain
- **LLM**: OpenAI GPT-4
- **Database**: MySQL (prompt templates, executions)
- **Frontend**: React + TypeScript
