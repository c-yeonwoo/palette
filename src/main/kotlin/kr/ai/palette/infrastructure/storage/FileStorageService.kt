package kr.ai.palette.infrastructure.storage

import org.springframework.web.multipart.MultipartFile

/**
 * File storage service interface for managing file uploads and deletions.
 *
 * 보안 모델:
 *  - 업로드: storeFile() 은 S3 키만 반환 (URL 아님)
 *  - 조회: 매 요청마다 getPresignedDownloadUrl() 로 시간제한 URL 발급
 *  - DB 에는 키만 저장 (legacy URL이 들어와도 키만 추출해서 다시 서명)
 */
interface FileStorageService {
    /**
     * 파일 업로드 후 S3 키 반환 (URL 아님).
     * Legacy 호환을 위해 풀 URL 형식으로 반환되는 구현이 있을 수 있으나,
     * 새 코드는 getPresignedDownloadUrl() 로 다시 서명해서 사용해야 함.
     */
    fun storeFile(file: MultipartFile): String

    /**
     * S3 키 또는 풀 URL을 입력받아 삭제.
     */
    fun deleteFile(fileUrl: String)

    /**
     * Legacy: 파일 키 → 풀 URL.
     * S3 비공개 버킷 환경에선 이 URL이 직접 노출되면 안 됨.
     * 대신 getPresignedDownloadUrl() 사용 권장.
     */
    fun getFileUrl(key: String): String

    /**
     * S3 키 또는 기존 풀 URL을 입력받아 시간제한 다운로드용 presigned URL 발급.
     *
     * @param keyOrUrl S3 key (예: "photos/abc.jpg") 또는 풀 URL
     * @param ttlSeconds 만료 시간 (기본 1시간)
     * @return presigned URL — 만료 시간 내에만 접근 가능
     */
    fun getPresignedDownloadUrl(keyOrUrl: String, ttlSeconds: Long = 3600): String
}
