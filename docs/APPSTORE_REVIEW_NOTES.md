# App Store 재심사 제출 가이드 (Palette)

> 거절 8항목 대응 + App Store Connect 입력용 리뷰노트 + 사람이 직접 할 일.
> 코드 수정분은 prod 배포 완료(2026-06-27). PR #96(Apple 로그인) · #97(UGC/개인정보/mock).

---

## 1. App Store Connect — "App Review Information" 입력

**Sign-In required**: Yes

**Demo account (붙여넣기용)**
```
Username: dev@palette.kr
Password: devpass123
```

**Notes (영문 — 리뷰어가 읽음. 그대로 붙여넣기):**
```
IMPORTANT — the app opens with a closed-beta invite gate before the login screen.

1. On the first screen ("Closed Beta"), enter the invite code:  palette-beta-2026
2. Tap "이메일로 시작하기" (Start with email) → log in with the demo account:
      dev@palette.kr  /  devpass123
   This account is pre-approved and pre-populated with a friend network,
   so the feed, recommendations and matchmaking flows are fully browsable.

Notes for specific guidelines:
- 1.2 (UGC): On any profile (tap a card in the home feed → profile detail),
  the top-right "⋮" menu provides Report and Block. Reports/blocks are sent to
  our moderation queue and acted on within 24h. The EULA (마이페이지 → 이용약관,
  Article 3) states a zero-tolerance policy. Support: support@palette.ai.kr
- 4.8 (Login): "Sign in with Apple" is offered alongside Kakao on the login screen.
- 5.1.1 (Privacy): Account deletion is in 마이페이지 → 계정 삭제 (full anonymizing
  delete from within the app). Privacy Policy & Terms are linked on the same page.

The app is in Korean (target market: South Korea).
```

> ⚠️ `palette-beta-2026` 는 `.env.example` 기준값입니다. **prod 의 실제 `BETA_CODE` 환경변수와 일치하는지 반드시 확인** 후 기입하세요. 다르면 리뷰어가 게이트를 못 넘어 2.1.0 재거절됩니다.
> (대안: 심사 기간 동안 prod `BETA_CODE=` 를 비워 게이트를 끄면 코드 없이 통과.)

---

## 2. 거절 8항목 대응 — "Reply to App Review" (Resolution Center)

| 코드 | 사유 | 대응 (이번 배포 반영) |
|---|---|---|
| **4.8.0** | Login Services | ✅ Sign in with Apple **실구현**(네이티브 플로우 + 백엔드 JWKS 검증). 카카오와 동등 노출. |
| **1.2.0** | UGC Safety | ✅ 신고/차단 실동작(프로필 상세 ⋮ 메뉴) + 운영자 처리 큐(24h) + 약관 무관용 조항 + 인앱 지원 이메일(support@palette.ai.kr). |
| **5.1.1** | Privacy | ✅ 인앱 계정삭제(익명화) + 약관/개인정보 인앱 링크 + 가입 동의 체크박스. 미사용 권한(연락처·트래킹·갤러리저장) 제거. |
| **2.1.0** | Completeness | ✅ 데모계정+베타코드 리뷰노트 제공. localhost 하드코딩·가짜 도메인·미완성 "준비 중" 버튼 제거. |
| **2.3.3** | Metadata(스크린샷) | ⬜ **직접**: 스크린샷을 실제 앱 화면(현재 빌드)으로 교체. 과장/미존재 기능 화면 금지. |
| **2.3.8** | Metadata(이름·아이콘) | ✅ 앱명 "팔레트", 번들 kr.ai.palette, 1024 아이콘 정상. ⬜ ASC 설명/키워드에 미구현 기능(채팅 등) 언급 없는지 확인. |
| **4.0.0** | Design 서문 | (4.1/4.8 해소 시 동반 해소 — 별도 조치 불필요) |
| **4.1.0** | Copycats | ⬜ **직접**: 고유 컨셉(지인 네트워크 신뢰 기반 색깔 매칭) 강조. 타 앱 에셋 미사용 확인. 필요 시 Resolution Center 에 차별점 1–2줄 회신. |

**Resolution Center 회신 영문 템플릿:**
```
Thank you for the review. We have addressed the issues:

4.8 — Sign in with Apple is now implemented and offered with equal prominence
   next to Kakao on the login screen.
1.2 — Users can Report and Block any other user from the profile detail screen
   (top-right menu). Reports go to a moderation queue acted on within 24 hours.
   Our Terms of Service include a zero-tolerance policy for objectionable content
   and abusive users. In-app support: support@palette.ai.kr.
5.1.1 — Account deletion is available in-app (Settings → Delete Account) and fully
   anonymizes user data. Privacy Policy and Terms are linked in-app and at
   https://www.palette.ai.kr. We removed permission strings for features not in this build.
2.1 — Reviewer access: invite code "palette-beta-2026" then demo account
   dev@palette.kr / devpass123 (pre-approved, populated). Placeholder/incomplete
   controls were removed.
2.3 — Screenshots and metadata updated to reflect the current build.
4.1 — Palette is an original trust-based, friend-network matchmaking concept
   (color-personality matching via acquaintances); no third-party assets are used.

The app targets South Korea and the UI is in Korean.
```

---

## 3. 사람이 직접 해야 하는 것 (코드로 불가)

### 🔴 제출 전 필수
1. **Apple Developer Console → Identifiers → App ID `kr.ai.palette` → "Sign In with Apple" capability 체크 → Save.**
   (이게 빠지면 entitlement 가 프로비저닝에 안 들어가 빌드 서명/Apple 로그인 실패.)
2. **Xcode**: 프로젝트 열기 → 타겟 `palette` → Signing & Capabilities 에서 "Sign in with Apple" 표시 확인(자동) → 자동 서명으로 프로비저닝 갱신.
3. **빌드 전 최신 웹 반영**: `cd frontend && npm run build && npx cap sync ios` (이미 한 번 동기화함 — 추가 코드 변경 시 재실행).
4. **prod `BETA_CODE` 값 확인** → 리뷰노트의 `palette-beta-2026` 와 일치시키기 (또는 심사 기간 게이트 OFF).

### 🟡 메타데이터 (App Store Connect 웹)
5. **스크린샷**: 현재 빌드 실제 화면으로 (2.3.3). 미구현 기능 캡처 금지.
6. **앱 설명/프로모션 텍스트**: 채팅 등 미구현 기능 언급 제거 (2.3.8).
7. **연령 등급 17+**, 카테고리 = 소셜 네트워킹 또는 라이프스타일.
8. **개인정보 보호 URL**: `https://www.palette.ai.kr/privacy` 가 실제 응답하는지 확인 (없으면 호스팅 필요 — ASC 필수 입력란).
9. **App Privacy "Nutrition Label"**: 수집 데이터 = 이메일·전화번호·실명·생년월일·성별·사진·지역·기기ID/푸시토큰. "Linked to identity" 표시.

### ℹ️ 참고 (의도된 베타 동작 — 그대로 둠)
- 폰 인증은 베타에서 bypass(실제 SMS 미발송, 아무 코드 통과) — 리뷰어 가입을 돕는 설정.
- AI Signal 2번째 카드 해제는 결제 미검증(Phase 2). 베타에선 결제 UI 숨김.
- PhotoVerify(사진 본인인증)는 네비 진입점이 없어 사용자 도달 불가(dead code).

---

## 4. 배포/검증 상태 (2026-06-27)
- `Deploy — Prod` 성공. prod 스모크: `dev@palette.kr` 로그인 200, `/users/{id}/report`·`/block`·`/friends/invite-code` 401(인증보호=존재), Apple `/oauth/apple` 더미토큰 401(=검증코드 라이브).
- 프론트 build + vitest 34 GREEN · 백엔드 278 GREEN.
