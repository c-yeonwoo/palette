# 0037 — 팔레트의 분석: 인사이트 점진 공개 시스템

- **상태**: Accepted (Phase A+B+C — Phase D/E는 후속)
- **결정일**: 2026-06-07
- **결정자**: ys.choi

## 컨텍스트

LLM 기반 컬러 분석(`colorType.reasoning/personalitySummary/idealTypeInsight`)은 이미 있지만, **한 번에 발급되고 한 번에 노출**돼 사용자가 "팔레트가 나를 알아간다"는 점진적 발견을 못 느낌. 베타 사용자 피드백 — "팔레트만의 분석 시스템이 있다는 느낌이 필요".

## 결정

**프로필을 채울수록 5단계 인사이트가 unlock되는 패널**(`PaletteInsightPanel`)을 마이프로필 상단에 두고, 새 단계 진입 시 1회성 slide-up 모달로 "팔레트가 새로운 걸 알아냈어요" 내러티브를 만든다.

### 5단계 (unlock 조건)

| 단계 | 트리거(데이터 존재 여부) | 표시 내용 |
|---|---|---|
| 1. 당신의 결 🌱 | basicInfo(키/MBTI/직군) 중 하나 | "팔레트가 당신의 결을 읽고 있어요" |
| 2. 당신의 색 🎨 | `colorType.name` | 색 원 + 이름 + reasoning |
| 3. 당신의 매력 ✨ | `colorType.strengths` (Phase B NEW) | 강점 태그 칩 3-5개 |
| 4. 어울리는 인연 💞 | `colorType.idealTypeInsight` | 이상형 유추 단락 |
| 5. 데이트 코드 🧭 | completionRate ≥ 100 + colorType + attachmentProfile | 2축(에너지·계획) 좌표 시각화 |

잠긴 카드는 자물쇠 + "○○를 채우면 열려요" 안내 + 탭 시 편집 화면으로 deep-link.

### Phase B — 강점 태그 (백엔드 변경)

- 도메인 `ColorType.strengths: List<String>?` 추가
- ProfileEntity `color_strengths` TEXT (CSV 직렬화)
- `OpenAIService.SYSTEM_PROMPT` JSON 스키마에 `"strengths": [...]` 추가 + 작성 기준 명시 ("감수성 깊은 사색가" 같은 6~10자 명사구, 외모/스펙 제외)
- stub 모드도 답변 단서로 한국어 태그 4개 합성
- `AIProfileController.GenerateResponse` + `AIInterviewController.CompleteRequest`에 strengths 필드 추가

### Phase C — 데이트 코드 좌표 (프론트 정적)

- `lib/dateCode.ts` SoT — ColorType별로 (energy 0~100, planning 0~100) 정적 매핑 + 사분면 라벨/vibe
- 좌표 시각화: 2축 grid + dot
- 향후 LLM이 산출하도록 확장 가능(현재는 색 정체성과 결합된 정적 매핑이 신뢰성 ↑)

### Phase D/E — 후속 백로그

- Phase D (변화 추적·일지): 인사이트 history 테이블, 위클리 카드, 푸시 알림
- Phase E (벡터 임베딩): 인사이트+답변 임베딩 → 팔레트 Pick 코사인 유사도 매칭

## 결과

- 마이프로필 진입 즉시 "팔레트의 분석" 섹션 노출. 1/5 ~ 5/5 진행도 표시.
- 새 단계 진입 시 fullscreen 모달로 발견의 리듬 생성. localStorage(`palette:insights:seenStages:v1`)로 1회성 보장.
- 백엔드 LLM 비용 영향: strengths 1개 항목만 추가 → 토큰 증가 미미.
- compileKotlin / vite build / vitest(40) 통과.

## 주의

- LLM 환각 위험 — strengths가 어색하면 사용자 신뢰 깨짐. 프롬프트에 "외모/스펙 제외, 성격·관계 중심"·"명사구 끝맺음" 가이드 명시.
- 재생성 시점 — 답변 수정 시 자동 재생성하면 인사이트가 흔들림. 현재는 AI 프로필 enhance 완료 시점에만 생성(사용자가 "다시 분석" 명시적으로 누를 때만 갱신). 정책 추후 검토.
- localStorage 키 — 디바이스/브라우저 분리. 모달 보여주는 가벼운 UX라 서버 영속화 불필요.
