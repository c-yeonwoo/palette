# 0036 — 직군(CareerCategory) 풀 확장 (22 카테고리)

- **상태**: Accepted
- **결정일**: 2026-06-05
- **결정자**: ys.choi

## 컨텍스트

베타 초기 직군 enum 은 10개(IT/금융/교육/의료/미디어/서비스/제조/공무원/전문직/기타)로 출발했으나, 데이팅 도메인에선 다음 한계가 드러남:

- "전문직" 한 버킷에 변호사·회계사·연구원·교수가 모두 묶임 — 매칭 시그널 약함
- 디자인·마케팅·기획 같은 빈도 높은 직군이 "서비스" 또는 "기타"로 흘러감
- 군인·경찰·소방·예술/문화 같은 카테고리 자체 부재

## 결정

기존 10개에 12개 추가해 **22 카테고리 확장 풀**:

### 초기 10 (호환 유지)
`IT_DEVELOPMENT` · `FINANCE` · `EDUCATION` · `MEDICAL` · `MEDIA` · `SERVICE` · `MANUFACTURING` · `PUBLIC_OFFICIAL` · `PROFESSIONAL` (legacy bucket) · `OTHER`

### 확장 12
- `DESIGN` — 디자인/크리에이티브 (UX/UI, 그래픽)
- `PLANNING_STRATEGY` — 기획/전략/컨설팅
- `MARKETING` — 마케팅/홍보/광고
- `LAW` — 법조 (변호사·법무사·노무사)
- `ACCOUNTING_TAX` — 회계/세무
- `RESEARCH` — 연구/학술 (교수·연구원·R&D)
- `MILITARY_POLICE` — 군인/경찰/소방
- `SALES` — 영업/세일즈
- `CONSTRUCTION_REALESTATE` — 건설/건축/부동산
- `TRADE_LOGISTICS` — 무역/물류
- `ART_CULTURE` — 예술/문화/스포츠
- `STARTUP_BUSINESS` — 사업/창업/자영업
- `FREELANCE` · `STUDENT`

> SoT — 프론트 라벨/이모지: `frontend/src/lib/jobCategory.ts`
> 백엔드 enum: `kr.ai.palette.domain.profile.CareerCategory`
> ⚠️ enum value 는 DB 컬럼에 그대로 저장되므로 기존 값 제거·이름 변경 금지.

## 결과

- 신규 가입자는 LAW/ACCOUNTING_TAX/RESEARCH 등 세부 항목으로 유도
- `PROFESSIONAL` 은 legacy 잔존 데이터용으로만 유지 (신규 노출 X)
- 매칭 시그널 다양성 ↑ — 동일 직군 매칭 더 정밀

## 후속

- 필요 시 카테고리별 아이콘·이모지 표준화 (jobCategory.ts 에서 진행)
