package kr.ai.palette

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class PaletteApplication

fun main(args: Array<String>) {
	runApplication<PaletteApplication>(*args)
}
