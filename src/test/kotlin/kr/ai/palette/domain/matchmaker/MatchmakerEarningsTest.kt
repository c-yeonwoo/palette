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

        context("출금 holding 예약/확정/해제 (ADR 0023)") {
            it("예약하면 pending 증가, available 감소, withdrawn 불변") {
                val e = MatchmakerEarnings.initial().addReward(3000).reserveForWithdrawal(1000)
                e.pendingPoints shouldBe 1000
                e.getAvailablePoints() shouldBe 2000
                e.withdrawnPoints shouldBe 0
            }

            it("가용 초과 예약 시 예외") {
                val e = MatchmakerEarnings.initial().addReward(1000)
                shouldThrow<IllegalArgumentException> { e.reserveForWithdrawal(2000) }
            }

            it("확정하면 pending → withdrawn 이동") {
                val e = MatchmakerEarnings.initial().addReward(3000)
                    .reserveForWithdrawal(1000)
                    .confirmWithdrawal(1000)
                e.pendingPoints shouldBe 0
                e.withdrawnPoints shouldBe 1000
                e.getAvailablePoints() shouldBe 2000
            }

            it("해제하면 pending 감소 + available 복구 (withdrawn 불변)") {
                val e = MatchmakerEarnings.initial().addReward(3000)
                    .reserveForWithdrawal(1000)
                    .releaseWithdrawal(1000)
                e.pendingPoints shouldBe 0
                e.withdrawnPoints shouldBe 0
                e.getAvailablePoints() shouldBe 3000
            }

            it("예약보다 많이 확정/해제하면 예외") {
                val e = MatchmakerEarnings.initial().addReward(3000).reserveForWithdrawal(1000)
                shouldThrow<IllegalArgumentException> { e.confirmWithdrawal(2000) }
                shouldThrow<IllegalArgumentException> { e.releaseWithdrawal(2000) }
            }
        }
    }
})
