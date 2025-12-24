package kr.ai.palette.infrastructure.storage

import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.*

@Service
class FileStorageService {

    private val uploadDir: Path = Paths.get("uploads/photos")

    init {
        try {
            Files.createDirectories(uploadDir)
        } catch (e: IOException) {
            throw RuntimeException("Could not create upload directory", e)
        }
    }

    /**
     * 파일을 저장하고 저장된 파일의 URL을 반환
     */
    fun storeFile(file: MultipartFile): String {
        // 파일 이름 정규화
        val originalFilename = file.originalFilename ?: throw IllegalArgumentException("File must have a name")

        // 안전한 파일명 생성 (UUID + 확장자)
        val fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."))
        val storedFilename = "${UUID.randomUUID()}$fileExtension"

        try {
            // 파일 저장
            val targetLocation = uploadDir.resolve(storedFilename)
            Files.copy(file.inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING)

            // URL 반환 (실제 서비스에서는 CDN URL이나 S3 URL을 반환)
            return "/uploads/photos/$storedFilename"
        } catch (e: IOException) {
            throw RuntimeException("Failed to store file", e)
        }
    }

    /**
     * 파일 삭제
     */
    fun deleteFile(fileUrl: String) {
        try {
            val filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1)
            val filePath = uploadDir.resolve(filename)
            Files.deleteIfExists(filePath)
        } catch (e: IOException) {
            throw RuntimeException("Failed to delete file", e)
        }
    }

    /**
     * 파일 존재 여부 확인
     */
    fun fileExists(fileUrl: String): Boolean {
        val filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1)
        val filePath = uploadDir.resolve(filename)
        return Files.exists(filePath)
    }
}
