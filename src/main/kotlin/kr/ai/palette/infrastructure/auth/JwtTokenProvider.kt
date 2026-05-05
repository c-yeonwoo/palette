package kr.ai.palette.infrastructure.auth

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import kr.ai.palette.domain.auth.TokenProvider
import kr.ai.palette.domain.common.UserId
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import java.util.*
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(
    @Value("\${jwt.secret}") private val secret: String,
    @Value("\${jwt.access-token-expiry:3600}") private val accessTokenExpiry: Long,
    @Value("\${jwt.refresh-token-expiry:2592000}") private val refreshTokenExpiry: Long
) : TokenProvider {

    private val secretKey: SecretKey by lazy {
        Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))
    }

    override fun generateAccessToken(userId: UserId): String {
        val now = Date()
        val expiryDate = Date(now.time + accessTokenExpiry * 1000)

        return Jwts.builder()
            .subject(userId.value.toString())
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(secretKey)
            .compact()
    }

    override fun generateRefreshToken(userId: UserId): String {
        val now = Date()
        val expiryDate = Date(now.time + refreshTokenExpiry * 1000)

        return Jwts.builder()
            .subject(userId.value.toString())
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(secretKey)
            .compact()
    }

    override fun extractUserId(token: String): UserId? {
        return try {
            val claims = parseClaims(token)
            val userIdString = claims.subject
            UserId(UUID.fromString(userIdString))
        } catch (e: Exception) {
            null
        }
    }

    override fun validateToken(token: String): Boolean {
        return try {
            parseClaims(token)
            true
        } catch (e: Exception) {
            false
        }
    }

    override fun refreshTokenExpirySeconds(): Long = refreshTokenExpiry

    private fun parseClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}
