# 🚀 Quick Start Guide - LangGraph 프롬프트 시스템

## 현재 상태

### ✅ 실행 중인 서비스

```bash
✅ Backend (Spring Boot)   → http://localhost:8080  [RUNNING ✓]
✅ Frontend (React)        → http://localhost:3000  [RUNNING ✓]
❌ LangGraph Service       → http://localhost:8001  [NOT STARTED]
```

## 🎯 LangGraph 서비스 시작하기 (5분)

### Step 1: 환경 설정

```bash
# 프로젝트 루트에서 시작
cd langgraph-service

# Python 가상환경 생성
python -m venv venv

# 가상환경 활성화
source venv/bin/activate
# Windows의 경우: venv\Scripts\activate
```

### Step 2: 의존성 설치

```bash
pip install -r requirements.txt
```

설치되는 패키지:
- `fastapi`: REST API 서버
- `uvicorn`: ASGI 서버
- `langgraph`: LangGraph 워크플로우
- `langchain-openai`: OpenAI 연동
- `pydantic`: 데이터 검증

### Step 3: OpenAI API 키 설정 ⚠️ 필수

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
# 또는
open .env
```

**.env 파일 내용:**
```bash
# OpenAI API Key (필수!)
OPENAI_API_KEY=sk-your-actual-api-key-here

# Service Configuration (기본값 사용 가능)
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8001

# LLM Configuration (기본값 사용 가능)
DEFAULT_MODEL=gpt-4
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=1000
```

**OpenAI API 키 발급 방법:**
1. https://platform.openai.com/ 방문
2. 로그인 → API Keys 메뉴
3. "Create new secret key" 클릭
4. 생성된 키를 복사하여 .env 파일에 붙여넣기

### Step 4: 서비스 시작

```bash
# 가상환경이 활성화된 상태에서
python main.py
```

**성공 메시지:**
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 5: 헬스 체크

새 터미널을 열어서:
```bash
curl http://localhost:8001/health
```

**응답:**
```json
{"status": "healthy"}
```

---

## ✨ 첫 프롬프트 생성하기 (5분)

### 1. 프론트엔드 접속

브라우저에서 http://localhost:3000 열기

### 2. 로그인

- 이메일 로그인 또는 OAuth 로그인
- 회원가입이 필요한 경우 먼저 가입

### 3. 프롬프트 관리 화면 이동

1. 하단 네비게이션에서 **"마이페이지"** 클릭
2. **"프롬프트 관리"** 메뉴 클릭

### 4. 첫 프롬프트 템플릿 생성

**"+ 새로 만들기"** 버튼 클릭 후:

```yaml
이름: 프로필 요약 생성기
설명: 사용자 정보를 바탕으로 매력적인 프로필 요약을 생성합니다
카테고리: PROFILE_SUMMARY

템플릿:
"""
다음 사용자 정보를 바탕으로 데이팅 앱 프로필 요약을 작성하세요.

나이: {age}
직업: {job}
취미: {hobbies}
성격: {personality}

요구사항:
- 2-3문장으로 간결하게
- 긍정적이고 매력적인 톤
- 개성이 잘 드러나도록
"""

변수: age, job, hobbies, personality

시스템 메시지: 당신은 데이팅 앱의 프로필 작성 전문가입니다. 사용자의 매력을 최대한 잘 표현하는 요약문을 작성합니다.

Temperature: 0.7
Max Tokens: 300
```

**"생성"** 버튼 클릭

### 5. 프롬프트 활성화

생성된 프롬프트를 선택 → **"활성화"** 버튼 클릭

상태: DRAFT → ACTIVE ✓

### 6. 프롬프트 실행

1. 활성화된 프롬프트 선택
2. **"실행"** 버튼 클릭
3. 변수 값 입력:
   ```
   age: 28
   job: 소프트웨어 엔지니어
   hobbies: 여행, 사진, 독서
   personality: 외향적이고 호기심 많은
   ```
4. **"실행"** 버튼 클릭
5. AI 응답 확인! 🎉

---

## 🧪 API 테스트 (선택)

### cURL로 직접 테스트

#### 1. 프롬프트 템플릿 생성

```bash
curl -X POST http://localhost:8080/api/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 프롬프트",
    "description": "간단한 테스트용 프롬프트",
    "category": "GENERAL",
    "template": "다음 질문에 답해주세요: {question}",
    "variables": ["question"],
    "systemMessage": "당신은 친절한 어시스턴트입니다.",
    "temperature": 0.7,
    "maxTokens": 200
  }'
```

**응답에서 `id` 값을 복사**

#### 2. 프롬프트 실행

```bash
curl -X POST http://localhost:8080/api/prompts/{복사한-id}/activate \
  -H "Content-Type: application/json"
```

```bash
curl -X POST http://localhost:8080/api/prompts/{복사한-id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "question": "안녕하세요! 반갑습니다."
    }
  }'
```

#### 3. LangGraph 서비스 직접 호출

```bash
curl -X POST http://localhost:8001/api/completion \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "안녕하세요! 오늘 날씨가 어때요?",
    "system_message": "당신은 친절한 어시스턴트입니다.",
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

---

## 📊 프롬프트 카테고리 예시

### 1. PROFILE_SUMMARY (프로필 요약)

```
템플릿: "나이: {age}, 직업: {job}, 취미: {hobbies}를 바탕으로 프로필 요약을 작성하세요."
변수: age, job, hobbies
```

### 2. IDEAL_TYPE_ANALYSIS (이상형 분석)

```
템플릿: "원하는 연령대: {age_range}, 성격: {personality}, 데이트 스타일: {date_style}을 바탕으로 이상형을 분석하세요."
변수: age_range, personality, date_style
```

### 3. INTRODUCTION_ENHANCEMENT (자기소개 향상)

```
템플릿: "다음 자기소개를 더 매력적으로 개선하세요: {introduction}"
변수: introduction
```

### 4. COLOR_TYPE_RECOMMENDATION (색깔 타입 추천)

```
템플릿: "MBTI: {mbti}, 취미: {hobbies}, 가치관: {values}을 바탕으로 8가지 색깔 중 어울리는 타입을 추천하세요."
변수: mbti, hobbies, values
```

---

## ⚠️ 문제 해결

### LangGraph 서비스가 시작되지 않을 때

**증상:** `ModuleNotFoundError: No module named 'fastapi'`

**해결:**
```bash
# 가상환경이 활성화되었는지 확인
which python  # venv 경로가 나와야 함

# 의존성 재설치
pip install -r requirements.txt
```

---

**증상:** `OPENAI_API_KEY not found`

**해결:**
```bash
# .env 파일 생성 확인
ls -la .env

# .env 파일 내용 확인
cat .env | grep OPENAI_API_KEY

# API 키가 없다면 추가
echo "OPENAI_API_KEY=sk-your-key-here" >> .env
```

---

**증상:** `Port 8001 already in use`

**해결:**
```bash
# 8001 포트 사용 중인 프로세스 찾기
lsof -ti:8001

# 프로세스 종료
kill -9 $(lsof -ti:8001)

# 또는 .env에서 포트 변경
SERVICE_PORT=8002
```

---

### 백엔드 연결 오류

**증상:** 프론트엔드에서 "Failed to fetch" 오류

**확인:**
```bash
# 백엔드 상태 확인
curl http://localhost:8080/actuator/health

# 프롬프트 API 테스트
curl http://localhost:8080/api/prompts
```

---

### AI 응답이 느릴 때

**원인:** OpenAI API 응답 시간 (보통 2-5초)

**개선 방법:**
- `maxTokens` 값을 줄이기 (1000 → 500)
- `temperature` 값을 낮추기 (0.7 → 0.5)
- 더 빠른 모델 사용 (gpt-4 → gpt-3.5-turbo)

---

## 📈 다음 단계

### Phase 2: 프로필 등록 통합

1. **AIProfileEnhanceScreen.tsx** 수정
   - 프로필 요약 프롬프트 호출
   - AI 응답을 프로필에 자동 입력

2. **AboutMeScreen.tsx** 수정
   - 자기소개 향상 프롬프트 호출
   - 사용자 입력을 개선된 텍스트로 제안

3. **IdealTypeScreen.tsx** 수정
   - 이상형 분석 프롬프트 호출
   - 선택한 조건을 자연어로 변환

### Phase 3: AI 인터뷰 시스템

1. **InterviewScreen.tsx** 생성
   - ChatGPT 스타일 대화형 UI
   - 10-15개 질문 시퀀스
   - 답변 기반 프로필 자동 생성

2. **프롬프트 체인** 구현
   - 이전 답변을 다음 질문에 활용
   - LangGraph 상태 관리

---

## 🎉 성공!

모든 설정이 완료되었습니다!

1. ✅ 백엔드 서버 실행 중
2. ✅ 프론트엔드 실행 중
3. ✅ LangGraph 서비스 준비 완료
4. ✅ 프롬프트 관리 UI 사용 가능

**지금 바로 첫 AI 프롬프트를 만들어보세요!** 🚀

---

**도움말:**
- 상세 문서: `LANGGRAPH_SETUP_GUIDE.md`
- 시스템 아키텍처: `docs/langgraph-prompt-system.md`
- LangGraph 서비스: `langgraph-service/README.md`

**문의:**
- GitHub Issues 활용
- 또는 팀 채널에서 질문
