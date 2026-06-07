package kr.ai.palette.infrastructure.auth

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val customOAuth2UserService: CustomOAuth2UserService,
    private val oAuth2AuthenticationSuccessHandler: OAuth2AuthenticationSuccessHandler,
    private val oAuth2AuthenticationFailureHandler: OAuth2AuthenticationFailureHandler,
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    @Value("\${cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080}")
    private val corsAllowedOrigins: String,
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .headers { headers ->
                headers.frameOptions { it.sameOrigin() }
            }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers(
                        "/",
                        "/error",
                        "/favicon.ico",
                        // 회원가입/로그인 (인증 전)
                        "/api/v1/auth/email/**",
                        // 토큰 만료 시 refresh — access token 없이 refresh token 만으로 호출
                        "/api/v1/auth/refresh",
                        // Apple Sign In 콜백 — identityToken 검증 후 JWT 발급 (베타 stub, ADR 0040)
                        "/api/v1/auth/oauth/apple",
                        // 베타 게이트 — 회원가입 전 코드 검증/상태 조회
                        "/api/v1/auth/beta-code/**",
                        // 운영자 로그인 — 인증 전 호출 (이후 /api/v1/admin/** 는 hasRole("ADMIN"))
                        "/api/v1/admin/auth/login",
                        "/oauth2/**",
                        "/login/**",
                        "/h2-console/**",
                        "/api/v1/profile/public/**",
                        "/api/v1/users/*/public",
                        "/api/v1/ai-interview/questions",
                        "/api/v1/ai-profile/generate",
                        // 공유 링크 공개 resolve 만 permitAll — POST /link, GET /link/me 같은
                        // 인증 필수 엔드포인트가 매처에 잡혀 NPE 500 나는 걸 막기 위해
                        // 공개 경로를 /share/v/{code} 로 분리.
                        "/api/v1/share/v/*",
                        "/api/v1/ai/compatibility",
                        // 회원가입 전 호출 (인증 불필요)
                        "/api/v1/verification/phone/**",
                        // NICE 콜백은 NICE 서버가 호출 — 인증 불필요
                        "/api/v1/identity/nice/callback"
                    ).permitAll()
                    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                    .anyRequest().authenticated()
            }
            .oauth2Login { oauth2 ->
                oauth2
                    .userInfoEndpoint { it.userService(customOAuth2UserService) }
                    .successHandler(oAuth2AuthenticationSuccessHandler)
                    .failureHandler(oAuth2AuthenticationFailureHandler)
            }
            .exceptionHandling { exceptions ->
                exceptions
                    .authenticationEntryPoint { request, response, authException ->
                        // For API requests, return 401 instead of redirecting to login
                        if (request.requestURI.startsWith("/api/")) {
                            response.status = 401
                            response.contentType = "application/json"
                            response.writer.write("""{"error":"Unauthorized","message":"${authException.message}"}""")
                        } else {
                            // For non-API requests, redirect to OAuth2 login
                            response.sendRedirect("/oauth2/authorization/kakao")
                        }
                    }
            }
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        configuration.allowedOrigins = corsAllowedOrigins.split(",").map { it.trim() }
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true
        configuration.maxAge = 3600L

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }
}
