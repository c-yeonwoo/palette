package kr.ai.palette.infrastructure.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebConfig : WebMvcConfigurer {

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        // 업로드된 파일을 정적 리소스로 서빙 (로컬 스토리지)
        val tmpDir = System.getProperty("java.io.tmpdir")
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:$tmpDir/palette-uploads/")
    }
}
