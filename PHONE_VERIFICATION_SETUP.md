# Phone Verification Setup Guide

핸드폰 인증 기능이 성공적으로 통합되었습니다. 이 가이드는 NCP SENS SMS 서비스를 설정하고 핸드폰 인증 기능을 사용하는 방법을 설명합니다.

## 1. NCP SENS 설정

### 1.1 NCP 계정 생성 및 SENS 서비스 활성화

1. [Naver Cloud Platform](https://www.ncloud.com/)에 접속하여 계정 생성
2. 콘솔에서 **Application Service > SENS** 메뉴 선택
3. **SMS** 서비스 활성화

### 1.2 발신번호 등록

1. SENS 콘솔에서 **발신번호 관리** 선택
2. 본인 인증을 통해 발신번호 등록
3. 승인 완료까지 최대 1-2 영업일 소요

### 1.3 API 인증키 발급

1. NCP 콘솔 > **마이페이지** > **계정 관리** > **인증키 관리**
2. **API 인증키 관리** 선택
3. **신규 API 인증키 생성**
   - Access Key ID 저장
   - Secret Key 저장 (한 번만 표시되므로 반드시 저장)

### 1.4 Service ID 확인

1. SENS 콘솔 > **프로젝트** 선택
2. 프로젝트의 **Service ID** 복사

## 2. 환경 변수 설정

애플리케이션 실행 전에 다음 환경 변수를 설정해야 합니다.

### 방법 1: 환경 변수 직접 설정

```bash
export NCP_SENS_ACCESS_KEY=your_access_key_here
export NCP_SENS_SECRET_KEY=your_secret_key_here
export NCP_SENS_SERVICE_ID=ncp:sms:kr:your_service_id
export NCP_SENS_FROM_NUMBER=01012345678
```

### 방법 2: application.yml 직접 수정 (개발 환경만)

`src/main/resources/application.yml` 파일에서:

```yaml
ncp:
  sens:
    access-key: your_access_key_here
    secret-key: your_secret_key_here
    service-id: ncp:sms:kr:your_service_id
    from-number: 01012345678
```

⚠️ **주의**: 실제 키를 코드에 커밋하지 마세요! 개발 환경에서만 사용하세요.

### 방법 3: IntelliJ Run Configuration (추천)

1. IntelliJ에서 **Run > Edit Configurations** 선택
2. Spring Boot 애플리케이션 선택
3. **Environment variables** 섹션에 환경 변수 추가

## 3. API 엔드포인트

### 3.1 인증번호 발송

```http
POST /api/v1/verification/phone/send
Content-Type: application/json

{
  "phoneNumber": "010-1234-5678"
}
```

**응답:**
```json
{
  "success": true,
  "message": "인증번호가 발송되었습니다",
  "phoneNumber": "01012345678",
  "expiresAt": "2025-12-29T10:35:00"
}
```

### 3.2 인증번호 검증

```http
POST /api/v1/verification/phone/verify
Content-Type: application/json

{
  "phoneNumber": "010-1234-5678",
  "code": "123456",
  "userId": "optional-user-id-uuid"
}
```

**응답:**
```json
{
  "success": true,
  "message": "인증이 완료되었습니다",
  "phoneNumber": "01012345678"
}
```

## 4. 프론트엔드 통합

### 4.1 재사용 가능한 컴포넌트

`PhoneVerificationModal` 컴포넌트를 사용하여 어디서든 핸드폰 인증을 추가할 수 있습니다:

```tsx
import PhoneVerificationModal from './components/PhoneVerificationModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVerified = (phoneNumber: string) => {
    console.log('Verified phone:', phoneNumber);
    // 인증 완료 후 처리
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        핸드폰 인증
      </button>

      <PhoneVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVerified={handleVerified}
        userId={currentUserId} // Optional
        initialPhoneNumber="010-1234-5678" // Optional
      />
    </>
  );
}
```

### 4.2 직접 API 호출

```typescript
import { sendVerificationCode, verifyCode } from '@/lib/api/phoneVerification';

// 인증번호 발송
const response = await sendVerificationCode('010-1234-5678');
if (response.success) {
  console.log('Code sent!');
}

// 인증번호 검증
const verifyResponse = await verifyCode('010-1234-5678', '123456', userId);
if (verifyResponse.success) {
  console.log('Verified!');
}
```

## 5. 테스트

### 5.1 백엔드 테스트

```bash
# 컴파일 확인
./gradlew compileKotlin

# 애플리케이션 실행
./gradlew bootRun

# cURL로 테스트
curl -X POST http://localhost:8080/api/v1/verification/phone/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"010-1234-5678"}'
```

### 5.2 프론트엔드 테스트

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`로 접속하여 주선자 회원가입 화면에서 핸드폰 인증을 테스트합니다.

## 6. 주요 기능

✅ **인증번호 발송**
- 6자리 랜덤 숫자 생성
- 3분 유효기간
- NCP SENS API를 통한 SMS 발송

✅ **인증번호 검증**
- 만료 시간 확인
- 인증번호 일치 확인
- 사용자 정보 자동 업데이트 (userId 제공 시)

✅ **핸드폰 번호 정규화**
- 하이픈 자동 제거
- 국가번호 처리 (+82, 82 → 0)
- 010, 011, 016, 017, 018, 019 형식 지원

✅ **프론트엔드 기능**
- 실시간 타이머 (3분)
- 자동 번호 포맷팅 (010-1234-5678)
- 재발송 기능
- 입력 검증

## 7. 보안 고려사항

- ✅ 인증번호는 In-Memory 저장 (프로덕션에서는 Redis 권장)
- ✅ 3분 유효기간 후 자동 만료
- ✅ 인증 완료 후 인증 정보 즉시 삭제
- ✅ 핸드폰 번호 형식 검증
- ⚠️ API Rate Limiting 추가 권장
- ⚠️ IP 기반 발송 제한 추가 권장

## 8. 프로덕션 배포 시 고려사항

### 8.1 Redis 연동 (권장)

In-Memory 저장소를 Redis로 교체:

```kotlin
@Repository
class RedisPhoneVerificationRepository(
    private val redisTemplate: RedisTemplate<String, PhoneVerification>
) : PhoneVerificationRepository {
    // Redis 구현
}
```

### 8.2 환경 변수 관리

- AWS Systems Manager Parameter Store
- AWS Secrets Manager
- Kubernetes Secrets
- 환경별 설정 파일 분리

### 8.3 모니터링

- SMS 발송 성공률 모니터링
- 인증 성공률 추적
- 비정상적인 발송 패턴 감지

## 9. 비용

NCP SENS SMS 요금 (2025년 기준):
- 월 50건 무료
- 건당 9원 (단문 SMS)
- 자세한 요금은 [NCP 요금표](https://www.ncloud.com/product/applicationService/sens) 참고

## 10. 문제 해결

### SMS가 발송되지 않는 경우

1. 환경 변수 확인
2. NCP SENS 콘솔에서 발신번호 승인 상태 확인
3. API 인증키 유효성 확인
4. Service ID 정확성 확인
5. 로그 확인: `logging.level.kr.ai.palette: DEBUG`

### 컴파일 에러

```bash
./gradlew clean compileKotlin
```

### 인증번호가 만료되는 경우

- 3분 이내에 입력해야 합니다
- 재발송 버튼을 통해 새로운 인증번호 요청 가능

## 11. 다음 단계

- [ ] Redis 연동으로 확장성 개선
- [ ] Rate Limiting 추가
- [ ] SMS 발송 실패 재시도 로직
- [ ] 관리자 대시보드에서 인증 통계 확인
- [ ] 카카오 알림톡 통합 (선택사항)
