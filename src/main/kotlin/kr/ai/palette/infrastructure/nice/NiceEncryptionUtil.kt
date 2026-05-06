package kr.ai.palette.infrastructure.nice

import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.Mac
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * NICE 본인인증 API v2.0 암호화/복호화 유틸
 *
 * NICE API 응답에서 받은 tokenVal을 이용해
 *   key  = tokenVal[0..16]   (AES-128 키)
 *   iv   = tokenVal[16..32]  (초기화 벡터)
 *   hmac = tokenVal[32..64]  (HMAC-SHA256 키)
 */
object NiceEncryptionUtil {

    /**
     * AES-128 CBC 암호화 후 Base64 인코딩
     */
    fun encrypt(plainText: String, key: ByteArray, iv: ByteArray): String {
        val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"), IvParameterSpec(iv))
        val encrypted = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))
        return Base64.getUrlEncoder().withoutPadding().encodeToString(encrypted)
    }

    /**
     * Base64 디코딩 후 AES-128 CBC 복호화
     */
    fun decrypt(encBase64: String, key: ByteArray, iv: ByteArray): String {
        val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
        cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, "AES"), IvParameterSpec(iv))
        val decoded = Base64.getUrlDecoder().decode(encBase64)
        return String(cipher.doFinal(decoded), Charsets.UTF_8)
    }

    /**
     * HMAC-SHA256 무결성 검증값 생성 후 Base64 인코딩
     */
    fun hmacSha256(data: String, hmacKey: ByteArray): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(hmacKey, "HmacSHA256"))
        val result = mac.doFinal(data.toByteArray(Charsets.UTF_8))
        return Base64.getUrlEncoder().withoutPadding().encodeToString(result)
    }

    /**
     * tokenVal (Base64) → key / iv / hmacKey 추출
     * NICE API 문서 기준: tokenVal 40바이트를 Base64 디코딩 후
     *   key    = bytes[0..16)
     *   iv     = bytes[16..32)
     *   hmacKey = bytes[0..32)  ← 전체 32바이트 사용
     */
    fun deriveKeys(tokenVal: String): Triple<ByteArray, ByteArray, ByteArray> {
        val tokenBytes = tokenVal.toByteArray(Charsets.UTF_8)
        val key = tokenBytes.copyOfRange(0, 16)
        val iv = tokenBytes.copyOfRange(16, 32)
        val hmacKey = tokenBytes.copyOfRange(0, 32)
        return Triple(key, iv, hmacKey)
    }
}
