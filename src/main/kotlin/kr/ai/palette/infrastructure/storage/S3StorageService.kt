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
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest
import java.time.Duration
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
    private val s3Presigner: S3Presigner

    init {
        val credentials = AwsBasicCredentials.create(accessKey, secretKey)
        val credentialsProvider = StaticCredentialsProvider.create(credentials)
        val awsRegion = Region.of(region)

        s3Client = S3Client.builder()
            .region(awsRegion)
            .credentialsProvider(credentialsProvider)
            .build()

        s3Presigner = S3Presigner.builder()
            .region(awsRegion)
            .credentialsProvider(credentialsProvider)
            .build()
    }

    override fun storeFile(file: MultipartFile): String {
        val originalFilename = file.originalFilename
            ?: throw IllegalArgumentException("File must have a name")

        val fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."))
        val key = "photos/${UUID.randomUUID()}$fileExtension"

        try {
            val putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.contentType)
                .build()

            s3Client.putObject(
                putObjectRequest,
                RequestBody.fromInputStream(file.inputStream, file.size)
            )

            // 키만 반환 (조회 시 presigned URL 로 다시 서명)
            return key
        } catch (e: Exception) {
            throw RuntimeException("Failed to store file to S3", e)
        }
    }

    override fun deleteFile(fileUrl: String) {
        try {
            val key = extractKey(fileUrl)
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
        // Legacy 호환: presigned URL 로 대체 (TTL 1시간)
        return getPresignedDownloadUrl(key)
    }

    override fun getPresignedDownloadUrl(keyOrUrl: String, ttlSeconds: Long): String {
        val key = extractKey(keyOrUrl)
        val getObjectRequest = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build()

        val presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofSeconds(ttlSeconds))
            .getObjectRequest(getObjectRequest)
            .build()

        return s3Presigner.presignGetObject(presignRequest).url().toString()
    }

    /** 입력이 풀 URL이면 키만 추출, 이미 키면 그대로 반환 */
    private fun extractKey(keyOrUrl: String): String {
        val publicPrefix = "$bucketName.s3.$region.amazonaws.com/"
        return if (keyOrUrl.contains(publicPrefix)) {
            keyOrUrl.substringAfter(publicPrefix)
                .substringBefore("?")  // 기존 presigned URL의 쿼리스트링도 제거
        } else if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
            // 다른 호스트의 URL (예: legacy presigned, 외부 시드 데이터) — path만 추출
            val path = keyOrUrl.substringAfter("://").substringAfter("/").substringBefore("?")
            // 외부 URL은 우리 버킷이 아니므로 그대로 path 반환 (호출자가 검증)
            path
        } else {
            keyOrUrl  // 이미 키
        }
    }
}
