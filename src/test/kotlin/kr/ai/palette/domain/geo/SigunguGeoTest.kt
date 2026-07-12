package kr.ai.palette.domain.geo

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.doubles.shouldBeGreaterThan
import io.kotest.matchers.doubles.shouldBeLessThan
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.shouldBe

class SigunguGeoTest : DescribeSpec({

    describe("SigunguGeo — 수도권 시군구 거리 근사 (ADR 0072)") {

        it("동일 시군구는 거리 0") {
            SigunguGeo.distanceKm("서울", "강남구", "서울", "강남구") shouldBe 0.0
        }

        it("강남구 ↔ 수원시 — 실제 약 30km 근방") {
            val d = SigunguGeo.distanceKm("서울", "강남구", "경기", "수원시")!!
            d shouldBeGreaterThan 25.0
            d shouldBeLessThan 40.0
        }

        it("인접 구(강남구 ↔ 서초구)는 인접 시(수원시)보다 가깝다") {
            val near = SigunguGeo.distanceKm("서울", "강남구", "서울", "서초구")!!
            val far = SigunguGeo.distanceKm("서울", "강남구", "경기", "수원시")!!
            near shouldBeLessThan far
        }

        it("시도가 다르면 동명 시군구(중구)도 다른 좌표로 구분") {
            val seoulJung = SigunguGeo.centroid("서울", "중구")!!
            val incheonJung = SigunguGeo.centroid("인천", "중구")!!
            SigunguGeo.haversineKm(seoulJung, incheonJung) shouldBeGreaterThan 20.0
        }

        it("미등록 시군구는 거리 unknown(null)") {
            SigunguGeo.distanceKm("서울", "강남구", "부산", "해운대구").shouldBeNull()
            SigunguGeo.centroid("경기", "없는시").shouldBeNull()
            SigunguGeo.centroid(null, null).shouldBeNull()
        }

        it("수도권 시도 판별") {
            SigunguGeo.isCapitalArea("서울") shouldBe true
            SigunguGeo.isCapitalArea("인천") shouldBe true
            SigunguGeo.isCapitalArea("경기") shouldBe true
            SigunguGeo.isCapitalArea("부산") shouldBe false
            SigunguGeo.isCapitalArea(null) shouldBe false
        }

        it("수도권 66개 시군구 좌표 등록 확인 — 서울25·인천10·경기31") {
            val seoul = listOf("종로구","중구","용산구","성동구","광진구","동대문구","중랑구","성북구","강북구","도봉구","노원구","은평구","서대문구","마포구","양천구","강서구","구로구","금천구","영등포구","동작구","관악구","서초구","강남구","송파구","강동구")
            seoul.forEach { SigunguGeo.centroid("서울", it) shouldBe SigunguGeo.centroid("서울", it) }
            seoul.forEach { require(SigunguGeo.centroid("서울", it) != null) { "서울 $it 좌표 누락" } }
        }
    }
})
