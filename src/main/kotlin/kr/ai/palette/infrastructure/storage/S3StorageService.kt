package kr.ai.palette.infrastructure.storage

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.util.*

@Service
@ConditionalOnProperty(name = ["aws.s3.enabled"], havingValue = "true")
class S3StorageService(
    @Value("\${aws.region}") private val region: String,
    @Value("\${aws.s3.bucket-name}") private val bucketName: String,
    @Value("\${aws.credentials.access-key}") private val accessKey: String,
    @Value("\${aws.credentials.secret-key}") private val secretKey: String
) : FileStorageService {

    private val s3Client: S3Client

    init {
        val credentials = AwsBasicCredentials.create(accessKey, secretKey)
        s3Client = S3Client.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(credentials))
            .build()
    }

    override fun storeFile(file: MultipartFile): String {
        val originalFilename = file.originalFilename
            ?: throw IllegalArgumentException("File must have a name")

        // Generate safe filename with UUID
        val fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."))
        val key = "photos/${UUID.randomUUID()}$fileExtension"

        try {
            val putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.contentType)
                // ACL 제거 - 버킷 정책으로 public read 설정
                .build()

            s3Client.putObject(
                putObjectRequest,
                RequestBody.fromInputStream(file.inputStream, file.size)
            )

            return getFileUrl(key)
        } catch (e: Exception) {
            throw RuntimeException("Failed to store file to S3", e)
        }
    }

    override fun deleteFile(fileUrl: String) {
        try {
            // Extract key from URL
            val key = extractKeyFromUrl(fileUrl)

            val deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build()

            s3Client.deleteObject(deleteObjectRequest)
        } catch (e: Exception) {
            throw RuntimeException("Failed to delete file from S3", e)
        }
    }

    override fun getFileUrl(key: String): String {
        // Return public S3 URL
        return "https://$bucketName.s3.$region.amazonaws.com/$key"
    }

    private fun extractKeyFromUrl(fileUrl: String): String {
        // Extract key from S3 URL
        // Format: https://bucket.s3.region.amazonaws.com/key
        return fileUrl.substringAfter("$bucketName.s3.$region.amazonaws.com/")
    }
}
