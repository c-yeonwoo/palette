package kr.ai.palette.infrastructure.sms

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * NCP SENS SMS 서비스 설정
 */
@ConfigurationProperties(prefix = "ncp.sens")
data class NcpSensConfig(
    val accessKey: String,
    val secretKey: String,
    val serviceId: String,
    val fromNumber: String
)
