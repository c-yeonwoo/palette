package kr.ai.palette.domain

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.collections.shouldBeEmpty
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.*
import java.time.Instant
import java.util.UUID

class ProfileDomainTest : DescribeSpec({

    val userId = UserId(UUID.randomUUID())

    fun minimalProfile() = Profile.create(userId = userId, mbti = MBTI.ENFP)

    describe("Profile.updateColorType()") {

        it("새로운 ColorType으로 업데이트된 Profile을 반환한다") {
            val profile = minimalProfile()
            val colorType = ColorType(
                type = ColorTypeEnum.WARM_ORANGE,
                name = "따뜻한 오렌지",
                hex = "#FF8C00",
                description = "활기차고 따뜻한 성격"
            )
            val updated = profile.updateColorType(colorType)
            updated.colorType shouldBe colorType
        }

        it("원래 profile 객체는 변경되지 않는다 (불변성)") {
            val profile = minimalProfile()
            val colorType = ColorType(type = ColorTypeEnum.CALM_BLUE, name = "차분한 블루", hex = "#4169E1", description = "차분하고 안정적")
            profile.updateColorType(colorType)
            profile.colorType shouldBe null
        }

        it("colorType을 업데이트하면 metadata.updatedAt이 갱신된다") {
            val profile = minimalProfile()
            val original = profile.metadata.updatedAt
            Thread.sleep(10)
            val updated = profile.updateColorType(ColorType(type = ColorTypeEnum.SOFT_PINK, name = "부드러운 핑크", hex = "#FFB6C1", description = null))
            updated.metadata.updatedAt shouldNotBe original
        }

        it("모든 ColorTypeEnum 값을 적용할 수 있다") {
            val profile = minimalProfile()
            ColorTypeEnum.values().forEach { typeEnum ->
                val colorType = ColorType(type = typeEnum, name = typeEnum.name, hex = null, description = null)
                val updated = profile.updateColorType(colorType)
                updated.colorType?.type shouldBe typeEnum
            }
        }
    }

    describe("Profile.addPhoto() / removePhoto()") {

        fun makePhoto(profileId: ProfileId, order: Int = 0) = ProfilePhoto(
            id = ProfilePhotoId(UUID.randomUUID()),
            profileId = profileId,
            s3Key = "photos/test-$order.jpg",
            url = "https://example.com/photos/test-$order.jpg",
            displayOrder = order,
            isPrimary = order == 0,
            trustAnalysis = TrustAnalysis(trustFactor = TrustFactor.UNKNOWN, trustScore = 0),
            aiAnalysis = null,
            createdAt = Instant.now()
        )

        it("addPhoto() 후 사진 목록에 1개가 추가된다") {
            val profile = minimalProfile()
            val photo = makePhoto(profile.id)
            val updated = profile.addPhoto(photo)
            updated.photos shouldHaveSize 1
            updated.photos.first() shouldBe photo
        }

        it("사진을 여러 장 추가할 수 있다") {
            var profile = minimalProfile()
            repeat(3) { i ->
                profile = profile.addPhoto(makePhoto(profile.id, i))
            }
            profile.photos shouldHaveSize 3
        }

        it("removePhoto()로 특정 사진을 제거할 수 있다") {
            var profile = minimalProfile()
            val photo1 = makePhoto(profile.id, 0)
            val photo2 = makePhoto(profile.id, 1)
            profile = profile.addPhoto(photo1).addPhoto(photo2)

            val removed = profile.removePhoto(photo1.id)
            removed.photos shouldHaveSize 1
            removed.photos.first().id shouldBe photo2.id
        }

        it("없는 photoId를 removePhoto()해도 목록이 유지된다") {
            var profile = minimalProfile()
            val photo = makePhoto(profile.id)
            profile = profile.addPhoto(photo)

            val nonExistentId = ProfilePhotoId(UUID.randomUUID())
            val result = profile.removePhoto(nonExistentId)
            result.photos shouldHaveSize 1
        }
    }

    describe("Profile.calculateCompletionRate()") {

        it("아무 정보도 없는 기본 프로필은 완성도가 낮다") {
            val profile = minimalProfile()
            val rate = profile.calculateCompletionRate()
            // MBTI는 항상 counted (=1/23), 그 외 없으면 낮음
            (rate < 50) shouldBe true
        }

        it("BasicInfo(height + bodyType + mbti)가 채워지면 완성도가 증가한다") {
            val minimalRate = minimalProfile().calculateCompletionRate()
            val profileWithBasic = Profile.create(
                userId = userId,
                mbti = MBTI.INFJ,
                basicInfo = BasicInfo(height = 175, bodyType = BodyType.SLIM.name, mbti = MBTI.INFJ)
            )
            (profileWithBasic.calculateCompletionRate() > minimalRate) shouldBe true
        }

        it("사진 3장 이상이면 완성도가 더 높아진다") {
            var profile = Profile.create(
                userId = userId,
                mbti = MBTI.INFJ,
                basicInfo = BasicInfo(height = 175, bodyType = BodyType.SLIM.name, mbti = MBTI.INFJ),
                careerInfo = CareerInfo(category = CareerCategory.IT_DEVELOPMENT, company = "테크", incomeRange = IncomeRange.INCOME_RANGE_3),
                educationInfo = EducationInfo(level = EducationLevel.BACHELOR, school = "서울대", major = "컴공")
            )
            val rateWithoutPhotos = profile.calculateCompletionRate()

            // 사진 3장 추가
            repeat(3) { i ->
                val photo = ProfilePhoto(
                    id = ProfilePhotoId(UUID.randomUUID()),
                    profileId = profile.id,
                    s3Key = "k$i",
                    url = "u$i",
                    displayOrder = i,
                    isPrimary = i == 0,
                    trustAnalysis = TrustAnalysis(TrustFactor.UNKNOWN, 0),
                    aiAnalysis = null,
                    createdAt = Instant.now()
                )
                profile = profile.addPhoto(photo)
            }
            (profile.calculateCompletionRate() > rateWithoutPhotos) shouldBe true
        }

        it("사진 2장은 완성도 사진 항목을 채우지 않는다") {
            val profile = minimalProfile()
            var profileWith2Photos = profile
            repeat(2) { i ->
                val photo = ProfilePhoto(
                    id = ProfilePhotoId(UUID.randomUUID()),
                    profileId = profile.id,
                    s3Key = "k$i",
                    url = "u$i",
                    displayOrder = i,
                    isPrimary = i == 0,
                    trustAnalysis = TrustAnalysis(TrustFactor.UNKNOWN, 0),
                    aiAnalysis = null,
                    createdAt = Instant.now()
                )
                profileWith2Photos = profileWith2Photos.addPhoto(photo)
            }
            var profileWith3Photos = profile
            repeat(3) { i ->
                val photo = ProfilePhoto(
                    id = ProfilePhotoId(UUID.randomUUID()),
                    profileId = profile.id,
                    s3Key = "k$i",
                    url = "u$i",
                    displayOrder = i,
                    isPrimary = i == 0,
                    trustAnalysis = TrustAnalysis(TrustFactor.UNKNOWN, 0),
                    aiAnalysis = null,
                    createdAt = Instant.now()
                )
                profileWith3Photos = profileWith3Photos.addPhoto(photo)
            }
            (profileWith3Photos.calculateCompletionRate() > profileWith2Photos.calculateCompletionRate()) shouldBe true
        }

        it("완성도는 0~100 범위여야 한다") {
            val profile = minimalProfile()
            val rate = profile.calculateCompletionRate()
            (rate in 0..100) shouldBe true
        }
    }

    describe("Profile.recalculateMetrics()") {

        it("recalculateMetrics() 후 completionRate가 calculateCompletionRate()와 일치한다") {
            val profile = Profile.create(
                userId = userId,
                mbti = MBTI.ENFP,
                basicInfo = BasicInfo(180, BodyType.ATHLETIC.name, MBTI.ENFP),
                careerInfo = CareerInfo(CareerCategory.IT_DEVELOPMENT, "회사", IncomeRange.INCOME_RANGE_3)
            )
            val recalculated = profile.recalculateMetrics()
            recalculated.metrics.completionRate shouldBe profile.calculateCompletionRate()
        }
    }

    describe("Profile.access()") {
        it("access()를 호출하면 lastAccessedAt이 갱신된다") {
            val profile = minimalProfile()
            val original = profile.metadata.lastAccessedAt
            Thread.sleep(10)
            val accessed = profile.access()
            accessed.metadata.lastAccessedAt shouldNotBe original
        }
    }
})
