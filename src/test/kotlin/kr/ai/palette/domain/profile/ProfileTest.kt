package kr.ai.palette.domain.profile

import kr.ai.palette.domain.common.UserId
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldHaveSize
import java.util.UUID

class ProfileTest : DescribeSpec({
    describe("Profile") {
        val userId = UserId(UUID.randomUUID())

        context("기본 프로필을 생성할 때") {
            it("MBTI와 함께 프로필이 생성되어야 한다") {
                val profile = Profile.create(
                    userId = userId,
                    mbti = MBTI.ENFP
                )

                profile.userId shouldBe userId
                profile.basicInfo.mbti shouldBe MBTI.ENFP
                profile.photos.shouldBeEmpty()
                profile.videos.shouldBeEmpty()
                profile.personalityTests.shouldBeEmpty()
            }

            it("기본 completion rate는 0이어야 한다") {
                val profile = Profile.create(
                    userId = userId,
                    mbti = MBTI.INTJ
                )

                profile.metrics.completionRate shouldBe 0
            }
        }

        context("BasicInfo를 업데이트할 때") {
            it("새로운 BasicInfo가 반영되어야 한다") {
                val profile = Profile.create(userId, MBTI.ENFP)
                val newBasicInfo = BasicInfo(
                    height = 180,
                    bodyType = BodyType.ATHLETIC.name,
                    mbti = MBTI.INTJ
                )

                val updated = profile.updateBasicInfo(newBasicInfo)

                updated.basicInfo shouldBe newBasicInfo
                updated.basicInfo.height shouldBe 180
                updated.basicInfo.mbti shouldBe MBTI.INTJ
            }

            it("updatedAt이 갱신되어야 한다") {
                val profile = Profile.create(userId, MBTI.ENFP)
                val originalUpdatedAt = profile.metadata.updatedAt

                Thread.sleep(10) // 시간 차이를 위해 잠시 대기

                val newBasicInfo = BasicInfo(
                    height = 170,
                    bodyType = BodyType.SLIM.name,
                    mbti = MBTI.ISFJ
                )
                val updated = profile.updateBasicInfo(newBasicInfo)

                updated.metadata.updatedAt shouldNotBe originalUpdatedAt
            }
        }

        context("PersonalityTest를 추가할 때") {
            it("새로운 테스트가 리스트에 추가되어야 한다") {
                val profile = Profile.create(userId, MBTI.ENFP)
                val test = PersonalityTestResult(
                    link = "https://example.com/test",
                    title = "테스트 타이틀"
                )

                val updated = profile.addPersonalityTest(test)

                updated.personalityTests shouldHaveSize 1
                updated.personalityTests.first() shouldBe test
            }

            it("여러 테스트를 추가할 수 있어야 한다") {
                var profile = Profile.create(userId, MBTI.ENFP)

                val test1 = PersonalityTestResult("https://test1.com", "테스트1")
                val test2 = PersonalityTestResult("https://test2.com", "테스트2")

                profile = profile.addPersonalityTest(test1)
                profile = profile.addPersonalityTest(test2)

                profile.personalityTests shouldHaveSize 2
            }
        }

        context("PersonalityTest를 제거할 때") {
            it("해당 링크의 테스트가 제거되어야 한다") {
                var profile = Profile.create(userId, MBTI.ENFP)

                val test1 = PersonalityTestResult("https://test1.com", "테스트1")
                val test2 = PersonalityTestResult("https://test2.com", "테스트2")

                profile = profile.addPersonalityTest(test1)
                profile = profile.addPersonalityTest(test2)

                val updated = profile.removePersonalityTest("https://test1.com")

                updated.personalityTests shouldHaveSize 1
                updated.personalityTests.first().link shouldBe "https://test2.com"
            }
        }

        context("프로필 완성도를 계산할 때") {
            it("MBTI가 있으면 완성도에 반영되어야 한다") {
                val profile = Profile.create(
                    userId = userId,
                    mbti = MBTI.ENFP,
                    basicInfo = BasicInfo(180, BodyType.ATHLETIC.name, MBTI.ENFP)
                )

                val completionRate = profile.calculateCompletionRate()
                completionRate shouldNotBe 0
            }

            it("더 많은 필드가 채워질수록 완성도가 높아져야 한다") {
                val profileMinimal = Profile.create(
                    userId = userId,
                    mbti = MBTI.ENFP
                )

                val profileWithBasicInfo = Profile.create(
                    userId = userId,
                    mbti = MBTI.ENFP,
                    basicInfo = BasicInfo(180, BodyType.ATHLETIC.name, MBTI.ENFP),
                    careerInfo = CareerInfo(CareerCategory.IT_DEVELOPMENT, "회사", IncomeRange.INCOME_RANGE_3),
                    educationInfo = EducationInfo(EducationLevel.BACHELOR, "학교", "전공")
                )

                val minimalRate = profileMinimal.calculateCompletionRate()
                val withBasicRate = profileWithBasicInfo.calculateCompletionRate()

                withBasicRate shouldNotBe minimalRate
            }
        }

        context("프로필 메트릭을 재계산할 때") {
            it("completionRate가 업데이트되어야 한다") {
                val profile = Profile.create(
                    userId = userId,
                    mbti = MBTI.ENFP,
                    basicInfo = BasicInfo(180, BodyType.ATHLETIC.name, MBTI.ENFP)
                )

                val recalculated = profile.recalculateMetrics()

                recalculated.metrics.completionRate shouldBe profile.calculateCompletionRate()
            }
        }
    }
})
