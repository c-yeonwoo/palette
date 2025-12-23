package kr.ai.palette.domain.profile

import kr.ai.palette.domain.common.UserId

data class Profile(
    val id: ProfileId,
    val userId: UserId,
    val basicInfo: BasicInfo,
    val careerInfo: CareerInfo,
    val educationInfo: EducationInfo,
    val locationInfo: LocationInfo,
    val introduction: Introduction,
    val lifestyleInfo: LifestyleInfo,
    val idealType: IdealType,
    val colorType: ColorType,
    val metrics: ProfileMetrics,
    val settings: ProfileSettings,
    val metadata: ProfileMetadata
) {
    fun isVisible(): Boolean {
        return settings.isVisible() && !metadata.isDeleted()
    }

    fun canReceiveMatches(): Boolean {
        return isVisible() && settings.isAcceptingMatches
    }

    fun recordView(): Profile {
        return copy(
            metrics = metrics.incrementViewCount(),
            metadata = metadata.access()
        )
    }

    fun updateBasicInfo(basicInfo: BasicInfo): Profile {
        return copy(
            basicInfo = basicInfo,
            metadata = metadata.update()
        )
    }

    fun updateCareerInfo(careerInfo: CareerInfo): Profile {
        return copy(
            careerInfo = careerInfo,
            metadata = metadata.update()
        )
    }

    fun updateEducationInfo(educationInfo: EducationInfo): Profile {
        return copy(
            educationInfo = educationInfo,
            metadata = metadata.update()
        )
    }

    fun updateLocationInfo(locationInfo: LocationInfo): Profile {
        return copy(
            locationInfo = locationInfo,
            metadata = metadata.update()
        )
    }

    fun updateIntroduction(introduction: Introduction): Profile {
        return copy(
            introduction = introduction,
            metadata = metadata.update()
        )
    }

    fun updateLifestyleInfo(lifestyleInfo: LifestyleInfo): Profile {
        return copy(
            lifestyleInfo = lifestyleInfo,
            metadata = metadata.update()
        )
    }

    fun updateIdealType(idealType: IdealType): Profile {
        return copy(
            idealType = idealType,
            metadata = metadata.update()
        )
    }

    fun updateColorType(colorType: ColorType): Profile {
        return copy(
            colorType = colorType,
            metadata = metadata.update()
        )
    }

    fun toggleAcceptingMatches(): Profile {
        return copy(
            settings = settings.toggleAcceptingMatches(),
            metadata = metadata.update()
        )
    }

    fun hide(): Profile {
        return copy(
            settings = settings.hide(),
            metadata = metadata.update()
        )
    }

    fun show(): Profile {
        return copy(
            settings = settings.show(),
            metadata = metadata.update()
        )
    }

    fun delete(): Profile {
        return copy(metadata = metadata.delete())
    }
}
