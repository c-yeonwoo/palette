package kr.ai.palette.infrastructure.storage

import org.springframework.web.multipart.MultipartFile

/**
 * File storage service interface for managing file uploads and deletions
 */
interface FileStorageService {
    /**
     * Store a file and return its URL
     * @param file The multipart file to store
     * @return The URL of the stored file
     */
    fun storeFile(file: MultipartFile): String

    /**
     * Delete a file by its URL or key
     * @param fileUrl The URL or key of the file to delete
     */
    fun deleteFile(fileUrl: String)

    /**
     * Get the public URL for a file
     * @param key The file key/path
     * @return The public URL
     */
    fun getFileUrl(key: String): String
}
