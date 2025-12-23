package kr.ai.palette

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class PaletteApplication

fun main(args: Array<String>) {
	runApplication<PaletteApplication>(*args)
}
