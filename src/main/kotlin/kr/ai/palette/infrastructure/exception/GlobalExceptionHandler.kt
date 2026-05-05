package kr.ai.palette.infrastructure.exception

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.multipart.MaxUploadSizeExceededException

data class ErrorResponse(
    val code: String,
    val message: String,
    val details: List<String> = emptyList()
)

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(ex: IllegalArgumentException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.badRequest().body(
            ErrorResponse(
                code = "INVALID_ARGUMENT",
                message = ex.message ?: "잘못된 요청입니다"
            )
        )
    }

    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalState(ex: IllegalStateException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ErrorResponse(
                code = "INVALID_STATE",
                message = ex.message ?: "현재 상태에서 처리할 수 없는 요청입니다"
            )
        )
    }

    @ExceptionHandler(NoSuchElementException::class)
    fun handleNotFound(ex: NoSuchElementException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ErrorResponse(
                code = "NOT_FOUND",
                message = ex.message ?: "요청한 리소스를 찾을 수 없습니다"
            )
        )
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(ex: AccessDeniedException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ErrorResponse(
                code = "FORBIDDEN",
                message = "접근 권한이 없습니다"
            )
        )
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val details = ex.bindingResult.fieldErrors.map { "${it.field}: ${it.defaultMessage}" }
        return ResponseEntity.badRequest().body(
            ErrorResponse(
                code = "VALIDATION_ERROR",
                message = "입력값 검증에 실패했습니다",
                details = details
            )
        )
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(ex: MethodArgumentTypeMismatchException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.badRequest().body(
            ErrorResponse(
                code = "TYPE_MISMATCH",
                message = "잘못된 파라미터 형식입니다: ${ex.name}"
            )
        )
    }

    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun handleMaxUploadSize(ex: MaxUploadSizeExceededException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(
            ErrorResponse(
                code = "FILE_TOO_LARGE",
                message = "파일 크기가 너무 큽니다. 최대 허용 크기를 초과했습니다"
            )
        )
    }

    @ExceptionHandler(ResourceNotFoundException::class)
    fun handleNotFound2(ex: ResourceNotFoundException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ErrorResponse(code = "NOT_FOUND", message = ex.message ?: "리소스를 찾을 수 없습니다")
        )
    }

    @ExceptionHandler(DuplicateResourceException::class)
    fun handleDuplicate(ex: DuplicateResourceException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ErrorResponse(code = "DUPLICATE", message = ex.message ?: "이미 존재하는 리소스입니다")
        )
    }

    @ExceptionHandler(BusinessRuleViolationException::class)
    fun handleBusinessRule(ex: BusinessRuleViolationException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.badRequest().body(
            ErrorResponse(code = "BUSINESS_RULE_VIOLATION", message = ex.message ?: "비즈니스 규칙을 위반했습니다")
        )
    }

    @ExceptionHandler(PaymentRequiredException::class)
    fun handlePaymentRequired(ex: PaymentRequiredException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(
            ErrorResponse(code = "PAYMENT_REQUIRED", message = ex.message ?: "결제가 필요합니다")
        )
    }

    @ExceptionHandler(CoolTimeActiveException::class)
    fun handleCoolTime(ex: CoolTimeActiveException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
            ErrorResponse(
                code = "COOLTIME_ACTIVE",
                message = ex.message ?: "쿨타임 중입니다",
                details = listOf("remainingDays=${ex.remainingDays}")
            )
        )
    }

    @ExceptionHandler(UnsupportedOAuthProviderException::class)
    fun handleUnsupportedOAuthProvider(ex: UnsupportedOAuthProviderException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(
            ErrorResponse(
                code = "OAUTH_PROVIDER_NOT_SUPPORTED",
                message = "'${ex.provider}' 로그인은 아직 지원하지 않습니다"
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneral(ex: Exception): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ErrorResponse(
                code = "INTERNAL_ERROR",
                message = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요"
            )
        )
    }
}

// Domain-specific exceptions
class ResourceNotFoundException(message: String) : RuntimeException(message)
class DuplicateResourceException(message: String) : RuntimeException(message)
class BusinessRuleViolationException(message: String) : RuntimeException(message)
class PaymentRequiredException(message: String) : RuntimeException(message)
class CoolTimeActiveException(message: String, val remainingDays: Int) : RuntimeException(message)
