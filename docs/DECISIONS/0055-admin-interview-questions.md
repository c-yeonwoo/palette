# 0055 — AI 인터뷰 질문 어드민 관리

- **상태**: Accepted
- **결정일**: 2026-06-13
- **결정자**: ys.choi

## 컨텍스트

AI 인터뷰 질문 9개가 `AIInterviewController.INTERVIEW_QUESTIONS` 에 **하드코딩**돼 있어, 질문을 바꾸려면 배포가 필요했다. 운영자가 질문을 선별·추가·수정·순서변경·노출토글 할 수 있어야 함.

## 결정

질문을 DB(`interview_questions`)로 이관하고 어드민 CRUD 제공. 기존 하드코딩 9개는 **단일 출처**로 남겨 최초 부팅 시드에 사용.

### 데이터 모델

`interview_questions`:
- `question_key` (UNIQUE) — 안정 식별자(예: "job"). 프론트 answers 맵 키 → 변경 시 중복만 차단
- `display_order` — 노출 순서
- `category`, `question`, `hint`, `input_type`(chips|text)
- `chips` — chips 선택지, 줄바꿈 join 저장 (라벨에 \n 없음)
- `active` — 비활성 질문은 인터뷰에서 제외
- timestamps

### 동작

| 경로 | 동작 |
|---|---|
| `GET /api/v1/ai-interview/questions` (사용자) | DB 활성 질문 순서대로. **비어있으면 하드코딩 기본값 폴백** (안전) |
| `InterviewQuestionSeeder` (부팅, 전 프로파일) | 테이블 비어있을 때만 기본 9개 시드 — `AIInterviewController.INTERVIEW_QUESTIONS` 출처 |
| `GET/POST/PUT/PATCH·active/DELETE /api/v1/admin/interview-questions` | 운영자 CRUD (ADMIN 권한) |

### 어드민 UI

`AdminInterviewQuestionsScreen` — 질문 목록(순서·카테고리·유형·키·내용·힌트·선택지·활성), 활성 토글, 추가/수정 폼(유형 따라 선택지 입력), 삭제. 대시보드 "운영 인프라" 섹션에 진입 카드.

## 구현 범위

- ✅ 백엔드: `InterviewQuestionEntity`/Repository/Seeder, `AIInterviewController.getQuestions` DB 연동(+폴백), `AdminInterviewQuestionsController` CRUD, migration(`interview_questions`)
- ✅ 어드민: `AdminInterviewQuestionsScreen` + AdminApp 라우트 + 대시보드 nav, `adminApi.put` 추가

## 보류 / 후속

- 질문별 답변 통계/응답률 (현재는 관리만)
- LLM 프롬프트가 question_key 에 의존하는 부분 점검 — 키 변경 시 영향 (현재는 자유 추가 위주라 영향 적음)
- 드래그 순서변경 UI (현재는 순서 숫자 직접 입력)

## 결과

- 배포 없이 운영자가 인터뷰 질문을 즉시 조정 → 베타 중 질문 튜닝 자유도 확보
- 폴백 설계로 DB 비어도(또는 장애) 인터뷰는 항상 동작
