package kr.ai.palette.domain.matchmaker

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.assertions.throwables.shouldThrow

class MatchmakerEarningsTest : DescribeSpec({

    describe("MatchmakerEarnings") {

        context("초기 상태") {
            it("모든 포인트가 0이어야 한다") {
                val earnings = MatchmakerEarnings.initial()
                earnings.totalPoints shouldBe 0
                earnings.withdrawnPoints shouldBe 0
                earnings.pendingPoints shouldBe 0
                earnings.getAvailablePoints() shouldBe 0
            }
        }

        context("리워드 추가") {
            it("포인트를 추가하면 totalPoints와 availablePoints가 증가한다") {
                val earnings = MatchmakerEarnings.initial().addReward(1500)
                earnings.totalPoints shouldBe 1500
                earnings.getAvailablePoints() shouldBe 1500
                earnings.withdrawnPoints shouldBe 0
            }

            it("여러 번 리워드를 추가할 수 있다") {
                val earnings = MatchmakerEarnings.initial()
                    .addReward(1500)
                    .addReward(1500)
                earnings.totalPoints shouldBe 3000
                earnings.getAvailablePoints() shouldBe 3000
            }
        }

        context("출금") {
            it("가용 포인트 내에서 출금하면 withdrawnPoints가 증가한다") {
                val earnings = MatchmakerEarnings.initial()
                    .addReward(3000)
                    .withdraw(1000)
                earnings.withdrawnPoints shouldBe 1000
                earnings.getAvailablePoints() shouldBe 2000
                earnings.totalPoints shouldBe 3000
            }

            it("전액 출금 가능") {
                val earnings = MatchmakerEarnings.initial()
                    .addReward(1500)
                    .withdraw(1500)
                earnings.getAvailablePoints() shouldBe 0
                earnings.withdrawnPoints shouldBe 1500
            }

            it("가용 포인트 초과 출금 시 예외 발생") {
                val earnings = MatchmakerEarnings.initial().addReward(1000)
                shouldThrow<IllegalArgumentException> {
                    earnings.withdraw(2000)
                }
            }
        }

        context("가용 포인트 계산") {
            it("가용 포인트 = 총 포인트 - 출금액") {
                val earnings = MatchmakerEarnings(
                    totalPoints = 5000,
                    withdrawnPoints = 2000,
                    pendingPoints = 0
                )
                earnings.getAvailablePoints() shouldBe 3000
            }
        }
    }
})
