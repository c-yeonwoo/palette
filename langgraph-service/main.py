"""
LangGraph AI Service for Palette

이 서비스는 프롬프트 실행을 위한 LangGraph 워크플로우를 제공합니다.
"""

import os
from typing import Dict, Any, Optional, TypedDict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# 환경 변수 로드
load_dotenv()

app = FastAPI(
    title="Palette LangGraph AI Service",
    description="AI 요약 및 프로필 생성을 위한 LangGraph 기반 서비스",
    version="1.0.0"
)

# LLM 설정
llm = ChatOpenAI(
    model=os.getenv("DEFAULT_MODEL", "gpt-4"),
    temperature=float(os.getenv("DEFAULT_TEMPERATURE", "0.7")),
    max_tokens=int(os.getenv("DEFAULT_MAX_TOKENS", "1000"))
)


# === Request/Response Models ===

class CompletionRequest(BaseModel):
    """AI 완성 요청"""
    prompt: str
    system_message: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class CompletionResponse(BaseModel):
    """AI 완성 응답"""
    content: str
    tokens_used: int
    model: str


# === LangGraph State ===

class WorkflowState(TypedDict):
    """워크플로우 상태"""
    prompt: str
    system_message: Optional[str]
    temperature: float
    max_tokens: int
    messages: list
    response: Optional[str]
    tokens_used: int
    error: Optional[str]


# === LangGraph Nodes ===

def validate_input(state: WorkflowState) -> WorkflowState:
    """입력 검증 노드"""
    if not state["prompt"] or len(state["prompt"].strip()) == 0:
        state["error"] = "Prompt cannot be empty"
    return state


def build_messages(state: WorkflowState) -> WorkflowState:
    """메시지 빌드 노드"""
    messages = []

    # System message 추가
    if state.get("system_message"):
        messages.append(SystemMessage(content=state["system_message"]))

    # Human message 추가
    messages.append(HumanMessage(content=state["prompt"]))

    state["messages"] = messages
    return state


def call_llm(state: WorkflowState) -> WorkflowState:
    """LLM 호출 노드"""
    try:
        # LLM 설정
        model = ChatOpenAI(
            model=os.getenv("DEFAULT_MODEL", "gpt-4"),
            temperature=state["temperature"],
            max_tokens=state["max_tokens"]
        )

        # LLM 호출
        response = model.invoke(state["messages"])

        state["response"] = response.content
        state["tokens_used"] = response.response_metadata.get("token_usage", {}).get("total_tokens", 0)

    except Exception as e:
        state["error"] = str(e)

    return state


def should_continue(state: WorkflowState) -> str:
    """계속 진행 여부 결정"""
    if state.get("error"):
        return "error"
    return "continue"


# === LangGraph Workflow 구성 ===

def create_workflow() -> StateGraph:
    """AI 완성 워크플로우 생성"""
    workflow = StateGraph(WorkflowState)

    # 노드 추가
    workflow.add_node("validate", validate_input)
    workflow.add_node("build", build_messages)
    workflow.add_node("execute", call_llm)

    # 엣지 추가
    workflow.set_entry_point("validate")

    workflow.add_conditional_edges(
        "validate",
        should_continue,
        {
            "continue": "build",
            "error": END
        }
    )

    workflow.add_edge("build", "execute")
    workflow.add_edge("execute", END)

    return workflow.compile()


# 워크플로우 인스턴스
completion_workflow = create_workflow()


# === API Endpoints ===

@app.get("/")
async def root():
    """헬스 체크"""
    return {
        "service": "Palette LangGraph AI Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}


@app.post("/api/completion", response_model=CompletionResponse)
async def generate_completion(request: CompletionRequest):
    """
    AI 완성 생성

    LangGraph 워크플로우를 사용하여 프롬프트를 실행하고 AI 응답을 생성합니다.
    """
    # 초기 상태 설정
    initial_state: WorkflowState = {
        "prompt": request.prompt,
        "system_message": request.system_message,
        "temperature": request.temperature or float(os.getenv("DEFAULT_TEMPERATURE", "0.7")),
        "max_tokens": request.max_tokens or int(os.getenv("DEFAULT_MAX_TOKENS", "1000")),
        "messages": [],
        "response": None,
        "tokens_used": 0,
        "error": None
    }

    # 워크플로우 실행
    result = completion_workflow.invoke(initial_state)

    # 에러 처리
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])

    if not result.get("response"):
        raise HTTPException(status_code=500, detail="Failed to generate response")

    return CompletionResponse(
        content=result["response"],
        tokens_used=result["tokens_used"],
        model=os.getenv("DEFAULT_MODEL", "gpt-4")
    )


@app.post("/api/profile-summary")
async def generate_profile_summary(data: Dict[str, Any]):
    """
    프로필 요약 생성

    사용자 프로필 데이터를 받아 매력적인 요약문을 생성합니다.
    """
    prompt = f"""사용자 프로필을 분석하여 매력적인 요약문을 작성하세요.

나이: {data.get('age', 'N/A')}
직업: {data.get('job', 'N/A')}
취미: {data.get('hobbies', 'N/A')}
성격: {data.get('personality', 'N/A')}

요구사항:
- 2-3문장으로 간결하게
- 긍정적이고 매력적인 톤
- 개성이 드러나도록
"""

    system_message = "당신은 데이팅 앱의 프로필 작성 전문가입니다. 사용자의 매력을 최대한 잘 표현하는 요약문을 작성합니다."

    request = CompletionRequest(
        prompt=prompt,
        system_message=system_message,
        temperature=0.8,
        max_tokens=300
    )

    return await generate_completion(request)


@app.post("/api/ideal-type-analysis")
async def generate_ideal_type_analysis(data: Dict[str, Any]):
    """
    이상형 분석

    사용자의 이상형 선호도를 분석하고 설명을 생성합니다.
    """
    prompt = f"""사용자의 이상형 선호도를 분석하여 설명을 작성하세요.

연령대: {data.get('age_range', 'N/A')}
신장: {data.get('height_range', 'N/A')}
체형: {data.get('body_types', 'N/A')}
성격: {data.get('personalities', 'N/A')}
데이트 스타일: {data.get('date_style', 'N/A')}

요구사항:
- 2-3문장으로 간결하게
- 어떤 사람을 찾고 있는지 명확하게
- 긍정적인 톤
"""

    system_message = "당신은 데이팅 앱의 매칭 전문가입니다. 사용자의 이상형을 분석하고 명확하게 설명합니다."

    request = CompletionRequest(
        prompt=prompt,
        system_message=system_message,
        temperature=0.7,
        max_tokens=300
    )

    return await generate_completion(request)


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("SERVICE_PORT", "8001"))

    uvicorn.run(app, host=host, port=port)
