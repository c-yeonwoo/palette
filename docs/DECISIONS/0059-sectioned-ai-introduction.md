# 0059 — AI 소개글 소주제 단락 구조화 (스토리 흐름)

- **상태**: Accepted
- **결정일**: 2026-06-14
- **결정자**: ys.choi
- **선행**: ADR 0016(AI 색깔 근거+소개글 500자+ 확장), 0056(다근거 색 분석), 0047(LLM 안전바)

## 컨텍스트

AI가 생성하던 자기소개글이 **하나의 긴 단락(또는 통짜 텍스트)** 으로 나왔다. 사용자가 고른 항목을 그대로 나열하는 듯한 느낌이 강했고, 상대가 읽을 때 "흐름"이 없어 어디서 무슨 이야기를 하는지 파악하기 어려웠다.

사용자 요청: "ai 소개글이 종합적으로 하나의 단락으로 나오는게 이상한 것 같아. 단락별로 주제·소주제를 가지고 전체적인 ai 프로필을 만들어줘야할 것 같아. 내가 설정한 항목을 그대로 보는게 아니라, 뭔가 자연스러운 말로 풀어주는거지. 상대방이 읽었을때 자연스러운 흐름으로 스토리를 읽을 수 있도록..!"

## 결정

소개글을 **소주제(heading) + 서술(body) 로 나뉜 섹션 배열**(`introductionSections`)로 생성한다.

### 데이터 모델
- `ProfileGenerationResult` 에 `introductionSections: List<IntroductionSection>` 추가. `IntroductionSection(heading, body)`.
- 하위호환·영속화를 위해 기존 `generatedIntroduction: String` 은 유지하되, 섹션이 있으면 **섹션을 합친 텍스트**(`"{heading}\n{body}"` 를 `\n\n` 로 join)로 채운다. → `App.tsx` 가 `introduction.text` 로 저장하는 흐름 무변경, MyProfile/ProfileDetail 도 그대로 렌더(소제목이 줄 단위로 노출).
- `GenerateResponse` DTO 에 `introductionSections: List<IntroSectionDto>` 추가.

### LLM 프롬프트
- `SYSTEM_PROMPT` 출력 JSON 에서 평면 `introduction` → `introductionSections` 배열로 교체.
- 작성 기준: 3~4 섹션, 전체 body 합 500~700자, 스토리 순서(인사→일상/취향→매력/가치관→만나고 싶은 사람), heading 은 항목 라벨 베끼기 금지·내용 함축형 소제목, body 는 답변을 **나열 말고 자연스러운 말로 풀어** 흐름 연결, 지어내기 금지.

### 파싱 / 안전바
- `parseIntroductionSections`: `[{heading, body}]` 파싱. body 빈 섹션 제외, 최대 5개. 모델 출력 변동에 관대.
- `introductionSections` 누락 시 → 평면 `introduction` 문자열 fallback (하위호환).
- stub(키 없음) 폴백도 4개 섹션 생성하도록 재작성 — 골든패스에서도 구조화된 결과 노출.

### 프론트
- `AIProfileEnhanceScreen`: `introductionSections` 있으면 소제목(불릿 + 굵은 제목) + body 들여쓰기 렌더, 없으면 기존 단일 단락 fallback. 글자수 카운트는 body 합 기준.

## 결과
- 색 생성 결과가 "스토리" 처럼 읽히고, 사용자가 고른 항목이 자연어로 풀린다.
- 기존 영속화·다른 화면 무영향(평면 텍스트 하위호환 유지).

## 검증
- `OpenAIServiceTest`: 섹션 파싱 / body 빈 섹션 제외 / 평면 fallback 케이스 추가.
- `SPRING_PROFILES_ACTIVE=test ./gradlew test` + `npm run build` + vitest 그린.
