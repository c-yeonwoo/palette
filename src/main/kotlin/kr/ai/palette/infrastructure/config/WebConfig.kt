package kr.ai.palette.infrastructure.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebConfig : WebMvcConfigurer {

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        // 업로드된 파일을 정적 리소스로 서빙
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:uploads/")
    }
}
