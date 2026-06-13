package kr.ai.palette.infrastructure.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import java.util.concurrent.ThreadPoolExecutor

@Configuration
@EnableAsync
class AsyncConfig {
    /**
     * @Async 전용 executor 를 명시적으로 bounded 풀로 고정한다.
     * 기본 executor 에 의존하면 작은 박스에서 스레드 baseline 이 불필요하게 높고,
     * 큐/풀 상한이 모호해 누수·고갈 진단이 어렵다 (인시던트 2026-06-13).
     * 큐가 차면 CallerRuns 로 호출 스레드에서 처리 → 무한 적체 방지.
     */
    @Bean("applicationTaskExecutor")
    fun applicationTaskExecutor(): ThreadPoolTaskExecutor =
        ThreadPoolTaskExecutor().apply {
            corePoolSize = 2
            maxPoolSize = 4
            setQueueCapacity(100)
            setThreadNamePrefix("async-")
            setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())
            setWaitForTasksToCompleteOnShutdown(true)
            setAwaitTerminationSeconds(20)
            initialize()
        }
}
