# Palette LangGraph AI Service

LangGraph를 사용한 AI 요약 및 프로필 생성 서비스입니다.

## 설치

### 1. Python 가상환경 생성

```bash
cd langgraph-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 OpenAI API 키를 설정하세요:

```
OPENAI_API_KEY=your_actual_api_key_here
```

## 실행

```bash
python main.py
```

서비스는 `http://localhost:8001`에서 실행됩니다.

## API 엔드포인트

### Health Check
```bash
GET http://localhost:8001/health
```

### AI 완성 생성
```bash
POST http://localhost:8001/api/completion
Content-Type: application/json

{
  "prompt": "사용자 프로필을 요약해주세요.",
  "system_message": "당신은 프로필 작성 전문가입니다.",
  "temperature": 0.7,
  "max_tokens": 500
}
```

### 프로필 요약 생성
```bash
POST http://localhost:8001/api/profile-summary
Content-Type: application/json

{
  "age": "28",
  "job": "소프트웨어 엔지니어",
  "hobbies": "여행, 사진, 독서",
  "personality": "외향적이고 호기심 많은"
}
```

### 이상형 분석
```bash
POST http://localhost:8001/api/ideal-type-analysis
Content-Type: application/json

{
  "age_range": "25-32",
  "height_range": "165-180cm",
  "body_types": ["슬림", "보통"],
  "personalities": ["유머러스", "지적인"],
  "date_style": "문화생활"
}
```

## LangGraph 워크플로우

서비스는 다음과 같은 LangGraph 워크플로우를 사용합니다:

```
START
  │
  ├─► validate_input (입력 검증)
  │
  ├─► build_messages (메시지 구성)
  │
  ├─► call_llm (LLM 호출)
  │
  └─► END
```

## Spring Boot 연동

Spring Boot 애플리케이션에서 이 서비스를 호출하려면 `RestClient`를 사용하세요:

```kotlin
val response = restClient.post()
    .uri("http://localhost:8001/api/completion")
    .contentType(MediaType.APPLICATION_JSON)
    .body(request)
    .retrieve()
    .body<CompletionResponse>()
```

## 개발 모드

개발 모드에서 자동 리로드를 활성화하려면:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## 테스트

```bash
# 헬스 체크
curl http://localhost:8001/health

# AI 완성 테스트
curl -X POST http://localhost:8001/api/completion \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "안녕하세요! 반갑습니다.",
    "system_message": "당신은 친절한 어시스턴트입니다.",
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

## 프로덕션 배포

프로덕션 환경에서는 Gunicorn을 사용하는 것을 권장합니다:

```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8001
```

## 환경 변수

- `OPENAI_API_KEY`: OpenAI API 키 (필수)
- `SERVICE_HOST`: 서비스 호스트 (기본값: 0.0.0.0)
- `SERVICE_PORT`: 서비스 포트 (기본값: 8001)
- `DEFAULT_MODEL`: 기본 LLM 모델 (기본값: gpt-4)
- `DEFAULT_TEMPERATURE`: 기본 temperature (기본값: 0.7)
- `DEFAULT_MAX_TOKENS`: 기본 max tokens (기본값: 1000)
