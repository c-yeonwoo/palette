# Palette 🎨

> "나의 색을 찾고, 너의 색과 조화를 이루다"  
> "Find Your Color, Meet Your Match"

**Palette**는 지인 네트워크 기반의 신뢰할 수 있는 주선 데이팅 서비스입니다.  
화가가 팔레트에서 자신의 그림에 어울리는 색을 고르듯, 각자의 개성과 이상형이라는 고유한 색을 찾아 조화로운 관계를 만들어갑니다.

---

## 🏗️ 기술 스택

| Layer | Tech |
|-------|------|
| Backend | Kotlin 2.x + Spring Boot 4.0.1 + Java 21 |
| ORM | Spring Data JPA (H2 dev / MySQL prod) |
| Auth | Spring Security + OAuth2 (Kakao) + JWT |
| AI | OpenAI gpt-4o-mini (프로필 색깔 분석) |
| Storage | AWS S3 (prod) / 로컬 (dev) |
| SMS | NCP SENS (prod) / Mock (dev) |
| Payment | Toss Payments (prod) / Mock (dev) |
| Push | Firebase FCM (prod) / Mock (dev) |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Architecture | DDD (Domain / Persistence / Application / Presentation) |

---

## 🚀 빠른 시작

### 환경 설정

```bash
cp .env.example .env
# .env에 필수 값 채우기 (최소: JWT_SECRET, KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET)
```

### 로컬 개발 (H2 인메모리)

```bash
# 백엔드 (로컬 프로파일: H2 + 테스트 환경변수)
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun

# 프론트엔드
cd frontend && npm install && npm run dev
```

### 테스트

```bash
# 백엔드
SPRING_PROFILES_ACTIVE=test ./gradlew test

# 프론트엔드
cd frontend && npx vitest run
```

### 프로덕션 빌드

```bash
# 백엔드
./gradlew build

# 프론트엔드
cd frontend && npm run build
```

---

## 📦 프로젝트 구조

```
palette/
├── src/main/kotlin/kr/ai/palette/
│   ├── domain/                  # 순수 비즈니스 로직 (framework 없음)
│   │   ├── user/                # User Aggregate
│   │   ├── profile/             # Profile Aggregate
│   │   ├── matchmaking/         # Matchmaking Aggregate
│   │   ├── matchmaker/          # Matchmaker Aggregate
│   │   ├── friendship/          # Friendship
│   │   ├── auth/                # Auth contracts
│   │   └── notification/        # Notification events
│   ├── persistence/             # JPA 엔티티 & 레포지토리 구현
│   ├── application/             # 유스케이스 서비스
│   ├── presentation/            # REST API 컨트롤러
│   └── infrastructure/          # Security, AI, SMS, 외부 연동
│
└── frontend/src/app/
    ├── components/              # 화면 컴포넌트 (React)
    ├── lib/api/                 # HTTP 클라이언트
    └── lib/auth/                # 인증 서비스
```

---

## 🔑 필수 환경변수

| 변수 | 용도 | 비고 |
|------|------|------|
| `JWT_SECRET` | JWT 서명 키 | `openssl rand -base64 64` |
| `KAKAO_CLIENT_ID` | Kakao OAuth2 | |
| `KAKAO_CLIENT_SECRET` | Kakao OAuth2 | |
| `MYSQL_*` (5개) | 프로덕션 DB | prod 프로파일 |
| `AWS_*` (3개) | S3 파일 저장소 | prod 프로파일 |
| `NCP_SENS_*` (4개) | SMS 인증 | prod 프로파일 |
| `OPENAI_API_KEY` | AI 프로필 생성 | |
| `TOSS_*` (2개) | 결제 | prod 프로파일 |
| `FIREBASE_*` (2개) | 푸시 알림 | prod 프로파일 |
| `REDIS_*` (3개) | 토큰/인증코드 저장 | prod 프로파일 |

전체 목록 및 설명: `.env.example`

---

## 🎯 핵심 비즈니스 로직

### 매칭 플로우
```
요청자 → [주선 요청] → 주선자 승인/거절
                          ↓ 승인
                    수신자 승인/거절
                          ↓ 승인
                    매칭 성공 → 연락처 교환 + 10일 쿨타임
```

### 신뢰도 점수 (Trust Score)
- 사진 업로드: +10/장 (최대 3장 = +30)
- 타인 촬영 사진: +20
- 전신 사진: +15 / 얼굴 명확: +10
- 영상 업로드: +50
- 과도한 보정: -10 / 얼굴 불명확: -15
- 등급: Bronze (0-40) / Silver (41-70) / Gold (71-100)

### 주선자 레벨 및 커미션
| 레벨 | 성공 횟수 | 커미션율 |
|------|----------|---------|
| Lv.1 새싹 | 0-2 | 30% |
| Lv.2 씨앗 | 3-5 | 35% |
| Lv.3 꽃봉오리 | 6-10 | 40% |
| Lv.4 꽃 | 11-20 | 45% |
| Lv.5 나무 | 21+ | 50% |

### 과금 구조
- 2촌 프로필 열람: 3,000원
- 주선 요청: 30,000원 (성공 시 커미션 30-50%)
- AI 시그널 2번째 카드: 1,000원

---

## 📊 구현 현황 (MVP)

### ✅ 구현 완료
- 이메일 회원가입/로그인 + JWT
- Kakao OAuth2 로그인
- 프로필 생성 플로우 (4단계)
- AI 프로필 분석 (OpenAI gpt-4o-mini) — `OPENAI_API_KEY` 필요
- 사진/영상 업로드 (S3 prod / 로컬 dev)
- 지인 네트워크 피드
- AI 시그널 추천 (현재 랜덤 시드 기반, Phase 3에서 벡터 유사도로 교체)
- 주선 요청 플로우 (2단계 승인)
- 주선자 대시보드 + 레벨 시스템
- 전화번호 인증 (NCP SENS prod / Mock dev)
- 푸시 알림 (FCM prod / Mock dev)
- 리그/랭킹 시스템

### 🚧 Phase 2 예정
- 채팅 (WebSocket/SSE)
- 실시간 알림
- 실제 결제 Toss Payments 검증 (현재 paymentKey 존재 여부만 체크)
- Apple/Google/Naver OAuth2 (현재 비활성화)
- 홈택스 직업 검증
- 사진 신원 검증 (Vision API 연동)

### 🚧 Phase 3 예정
- 벡터 유사도 매칭 (pgvector/Pinecone)
- 그룹 매칭
- AI 추천 알고리즘 고도화

---

## 🔒 보안 사항

- JWT secret은 환경변수 `JWT_SECRET`로만 주입 (코드 내 기본값 없음)
- OAuth 자격증명은 환경변수로만 주입 (코드 내 기본값 없음)
- H2 콘솔은 `local` 프로파일에서만 활성화
- `SPRING_PROFILES_ACTIVE=local`로 실행 시 개발용 더미 시크릿 사용 (application-local.yml)

---

## 📄 라이선스

Copyright © 2025 Palette. All rights reserved.

---

**Palette** — Where trust meets connection 🎨
