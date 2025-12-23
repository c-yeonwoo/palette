package kr.ai.palette.domain.user

import java.time.LocalDate

data class PublicInfo(
    val nickname: String,
    val birthDate: LocalDate,
    val gender: Gender
) {
    fun getAge(): Int {
        val today = LocalDate.now()
        var age = today.year - birthDate.year
        if (today.monthValue < birthDate.monthValue ||
            (today.monthValue == birthDate.monthValue && today.dayOfMonth < birthDate.dayOfMonth)) {
            age--
        }
        return age
    }
}

enum class Gender {
    MALE,
    FEMALE
}
