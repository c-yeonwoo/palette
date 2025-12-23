# Palette 로컬 개발 환경 설정

## 1. 카카오 개발자 콘솔 설정

1. [Kakao Developers](https://developers.kakao.com/) 접속 및 로그인
2. 애플리케이션 생성
3. **앱 키 확인**
   - 내 애플리케이션 > 앱 설정 > 앱 키
   - REST API 키 복사

4. **플랫폼 설정**
   - 내 애플리케이션 > 앱 설정 > 플랫폼
   - Web 플랫폼 등록
   - 사이트 도메인: `http://localhost:8080`

5. **Redirect URI 설정**
   - 내 애플리케이션 > 제품 설정 > 카카오 로그인
   - 활성화 설정: ON
   - Redirect URI 등록: `http://localhost:8080/login/oauth2/code/kakao`

6. **동의 항목 설정**
   - 내 애플리케이션 > 제품 설정 > 카카오 로그인 > 동의 항목
   - 닉네임: 필수 동의
   - 카카오계정(이메일): 선택 동의
   - 프로필 사진: 선택 동의

7. **Client Secret 발급 (보안 강화)**
   - 내 애플리케이션 > 제품 설정 > 카카오 로그인 > 보안
   - Client Secret: 사용함으로 변경
   - 코드 생성 후 복사

## 2. 로컬 설정 파일 생성

### 방법 1: application-local.yml 사용 (추천)

`src/main/resources/application-local.yml` 파일에 다음 내용 추가:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          kakao:
            client-id: {YOUR_KAKAO_REST_API_KEY}
            client-secret: {YOUR_KAKAO_CLIENT_SECRET}

jwt:
  secret: {YOUR_JWT_SECRET_KEY_256_BITS}
```

실행 시:
```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 방법 2: 환경변수 사용

`.env` 파일 생성 (`.env.example` 참고):
```bash
KAKAO_CLIENT_ID=your-kakao-rest-api-key
KAKAO_CLIENT_SECRET=your-kakao-client-secret
JWT_SECRET=your-jwt-secret-key
```

## 3. 애플리케이션 실행

```bash
# 빌드
./gradlew build

# 실행 (local profile)
./gradlew bootRun --args='--spring.profiles.active=local'

# 또는 환경변수와 함께 실행
KAKAO_CLIENT_ID=xxx KAKAO_CLIENT_SECRET=yyy ./gradlew bootRun
```

## 4. OAuth2 로그인 테스트

1. 브라우저에서 접속:
   ```
   http://localhost:8080/oauth2/authorization/kakao
   ```

2. 카카오 로그인 완료 후 리다이렉트:
   ```
   http://localhost:3000/oauth2/redirect?token={accessToken}&refreshToken={refreshToken}&isNewUser=true
   ```

3. Access Token으로 API 호출:
   ```bash
   curl -H "Authorization: Bearer {accessToken}" \
        http://localhost:8080/api/v1/auth/me
   ```

## 5. 보안 주의사항

⚠️ **절대 Git에 커밋하지 말 것:**
- `application-local.yml`
- `.env`
- API Keys, Secrets

✅ **안전한 방법:**
- `.gitignore`에 이미 추가되어 있음
- 프로덕션 환경에서는 AWS Secrets Manager, K8s Secrets 등 사용
- 개발 환경에서도 환경변수 사용 권장

## 6. H2 데이터베이스 콘솔 (개발용)

```
URL: http://localhost:8080/h2-console
JDBC URL: jdbc:h2:mem:testdb
Username: sa
Password: (비워둠)
```

## 7. API 문서

서버 실행 후:
```
http://localhost:8080/swagger-ui.html (TODO: Swagger 추가 시)
```

## 트러블슈팅

### 1. "Invalid redirect_uri" 에러
- 카카오 콘솔에서 Redirect URI 정확히 등록했는지 확인
- `http://localhost:8080/login/oauth2/code/kakao` (포트 번호 포함)

### 2. "Invalid client_secret" 에러
- Client Secret이 올바르게 설정되었는지 확인
- 카카오 콘솔에서 Client Secret "사용함" 설정 확인

### 3. JWT Token 검증 실패
- JWT Secret이 256비트(32자) 이상인지 확인
- Secret 키에 특수문자가 있다면 따옴표로 감싸기

## 다음 단계

1. 프론트엔드 OAuth2 리다이렉트 페이지 구현
2. Access Token 저장 및 API 호출
3. Refresh Token으로 토큰 갱신 구현
