package kr.ai.palette.infrastructure.storage

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Primary
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.util.UUID

/**
 * 로컬 파일 시스템 스토리지 (개발/테스트용 Mock)
 * aws.s3.enabled=false 또는 미설정 시 사용
 */
@Service
@Primary
@ConditionalOnProperty(name = ["aws.s3.enabled"], havingValue = "false", matchIfMissing = true)
class LocalStorageService : FileStorageService {

    private val uploadDir = File(System.getProperty("java.io.tmpdir"), "palette-uploads")

    init {
        uploadDir.mkdirs()
    }

    override fun storeFile(file: MultipartFile): String {
        val originalFilename = file.originalFilename ?: "file"
        val ext = originalFilename.substringAfterLast(".", "bin")
        val filename = "${UUID.randomUUID()}.$ext"
        val dest = File(uploadDir, filename)
        file.transferTo(dest)
        return "http://localhost:8080/uploads/$filename"
    }

    override fun deleteFile(fileUrl: String) {
        val filename = fileUrl.substringAfterLast("/")
        File(uploadDir, filename).delete()
    }

    override fun getFileUrl(key: String): String {
        return "http://localhost:8080/uploads/$key"
    }
}
