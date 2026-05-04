package kr.ai.palette.presentation.profile

import kr.ai.palette.domain.profile.ColorType
import kr.ai.palette.domain.profile.ColorTypeEnum
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class ColorTypeDtoTest {

    @Test
    fun `WARM_ORANGE maps to key orange`() {
        val ct = ColorType(type = ColorTypeEnum.WARM_ORANGE, name = "따뜻한 오렌지", hex = "#F97316", description = "활발하고 다정한")
        val dto = ColorTypeDto.from(ct)
        assertEquals("orange", dto.key)
        assertEquals("WARM_ORANGE", dto.type)
    }

    @Test
    fun `CALM_BLUE maps to key blue`() {
        val ct = ColorType(type = ColorTypeEnum.CALM_BLUE, name = "차분한 블루", hex = "#3B82F6", description = "신중하고 깊이있는")
        val dto = ColorTypeDto.from(ct)
        assertEquals("blue", dto.key)
    }

    @Test
    fun `all ColorTypeEnum values have a key mapping`() {
        val allMapped = ColorTypeEnum.entries.all { enum ->
            val ct = ColorType(type = enum, name = null, hex = null, description = null)
            val dto = ColorTypeDto.from(ct)
            dto.key != null
        }
        assertTrue(allMapped, "Every ColorTypeEnum value should have a corresponding key")
    }

    @Test
    fun `null type produces null key`() {
        val ct = ColorType(type = null, name = null, hex = null, description = null)
        val dto = ColorTypeDto.from(ct)
        assertNull(dto.key)
        assertNull(dto.type)
    }

    @Test
    fun `dto fields are correctly populated`() {
        val ct = ColorType(
            type = ColorTypeEnum.SOFT_PINK,
            name = "부드러운 핑크",
            hex = "#F9A8D4",
            description = "섬세하고 낭만적인"
        )
        val dto = ColorTypeDto.from(ct)
        assertEquals("pink", dto.key)
        assertEquals("SOFT_PINK", dto.type)
        assertEquals("부드러운 핑크", dto.name)
        assertEquals("#F9A8D4", dto.hex)
        assertEquals("섬세하고 낭만적인", dto.description)
    }
}
