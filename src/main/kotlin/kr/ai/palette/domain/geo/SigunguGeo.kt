package kr.ai.palette.domain.geo

import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * 수도권 시군구 → 중심좌표 근사 lookup + 거리 계산 (ADR 0072).
 *
 * 콜드스타트 공개 발견 풀의 거리 정렬용. 정식 위/경도(기기 위치 권한) 대신
 * 프로필의 (sido, sigungu) 문자열을 city-level 중심좌표로 근사한다 — 데이팅 거리
 * 정렬에는 충분하고 위치 권한 마찰이 없다.
 *
 * 키는 **(sido, sigungu) 복합** — "중구"·"서구"처럼 시도 간 중복 이름이 있으므로.
 * sido 는 프론트 저장 포맷(짧은 이름: "서울"/"인천"/"경기", regions.ts)과 일치시킨다.
 * v1 스코프 = 수도권(서울 25 · 인천 10 · 경기 31). 그 외 시군구는 좌표 없음 → 거리 unknown.
 */
object SigunguGeo {

    data class Coord(val lat: Double, val lng: Double)

    /** v1 스코프 시도(수도권). 공개 발견 풀 대상 지역 판별용. */
    val CAPITAL_AREA_SIDO: Set<String> = setOf("서울", "인천", "경기")

    fun isCapitalArea(sido: String?): Boolean = sido != null && sido in CAPITAL_AREA_SIDO

    /** (sido, sigungu) → 중심좌표. 미등록이면 null. */
    fun centroid(sido: String?, sigungu: String?): Coord? {
        if (sido == null || sigungu == null) return null
        return CENTROIDS[key(sido, sigungu)]
    }

    /**
     * 두 (sido, sigungu) 간 대권 거리(km). 한쪽이라도 좌표 미등록이면 null.
     */
    fun distanceKm(
        sidoA: String?, sigunguA: String?,
        sidoB: String?, sigunguB: String?,
    ): Double? {
        val a = centroid(sidoA, sigunguA) ?: return null
        val b = centroid(sidoB, sigunguB) ?: return null
        return haversineKm(a, b)
    }

    /** Haversine 대권 거리(km). */
    fun haversineKm(a: Coord, b: Coord): Double {
        val dLat = Math.toRadians(b.lat - a.lat)
        val dLng = Math.toRadians(b.lng - a.lng)
        val lat1 = Math.toRadians(a.lat)
        val lat2 = Math.toRadians(b.lat)
        val h = sin(dLat / 2) * sin(dLat / 2) +
            cos(lat1) * cos(lat2) * sin(dLng / 2) * sin(dLng / 2)
        return 2 * EARTH_RADIUS_KM * atan2(sqrt(h), sqrt(1 - h))
    }

    private fun key(sido: String, sigungu: String): String = "$sido|$sigungu"

    private const val EARTH_RADIUS_KM = 6371.0

    // 근사 중심좌표 (city-level, ~1-2km 오차 — 거리 정렬 목적으론 충분).
    private val CENTROIDS: Map<String, Coord> = buildMap {
        // ── 서울 25 자치구 ──
        put("서울|종로구", Coord(37.5730, 126.9794))
        put("서울|중구", Coord(37.5636, 126.9976))
        put("서울|용산구", Coord(37.5311, 126.9810))
        put("서울|성동구", Coord(37.5634, 127.0369))
        put("서울|광진구", Coord(37.5385, 127.0823))
        put("서울|동대문구", Coord(37.5744, 127.0396))
        put("서울|중랑구", Coord(37.6063, 127.0927))
        put("서울|성북구", Coord(37.5894, 127.0167))
        put("서울|강북구", Coord(37.6398, 127.0256))
        put("서울|도봉구", Coord(37.6688, 127.0471))
        put("서울|노원구", Coord(37.6542, 127.0568))
        put("서울|은평구", Coord(37.6027, 126.9291))
        put("서울|서대문구", Coord(37.5791, 126.9368))
        put("서울|마포구", Coord(37.5663, 126.9019))
        put("서울|양천구", Coord(37.5169, 126.8664))
        put("서울|강서구", Coord(37.5509, 126.8495))
        put("서울|구로구", Coord(37.4954, 126.8874))
        put("서울|금천구", Coord(37.4569, 126.8956))
        put("서울|영등포구", Coord(37.5264, 126.8963))
        put("서울|동작구", Coord(37.5124, 126.9393))
        put("서울|관악구", Coord(37.4784, 126.9516))
        put("서울|서초구", Coord(37.4837, 127.0324))
        put("서울|강남구", Coord(37.5172, 127.0473))
        put("서울|송파구", Coord(37.5145, 127.1059))
        put("서울|강동구", Coord(37.5301, 127.1238))

        // ── 인천 10 군·구 ──
        put("인천|중구", Coord(37.4738, 126.6216))
        put("인천|동구", Coord(37.4739, 126.6432))
        put("인천|미추홀구", Coord(37.4636, 126.6503))
        put("인천|연수구", Coord(37.4106, 126.6784))
        put("인천|남동구", Coord(37.4468, 126.7314))
        put("인천|부평구", Coord(37.5074, 126.7218))
        put("인천|계양구", Coord(37.5372, 126.7377))
        put("인천|서구", Coord(37.5455, 126.6759))
        put("인천|강화군", Coord(37.7469, 126.4878))
        put("인천|옹진군", Coord(37.4467, 126.6370))

        // ── 경기 31 시·군 ──
        put("경기|수원시", Coord(37.2636, 127.0286))
        put("경기|성남시", Coord(37.4200, 127.1267))
        put("경기|의정부시", Coord(37.7381, 127.0338))
        put("경기|안양시", Coord(37.3943, 126.9568))
        put("경기|부천시", Coord(37.5035, 126.7660))
        put("경기|광명시", Coord(37.4786, 126.8646))
        put("경기|평택시", Coord(36.9921, 127.1129))
        put("경기|동두천시", Coord(37.9036, 127.0606))
        put("경기|안산시", Coord(37.3219, 126.8309))
        put("경기|고양시", Coord(37.6584, 126.8320))
        put("경기|과천시", Coord(37.4292, 126.9877))
        put("경기|구리시", Coord(37.5943, 127.1296))
        put("경기|남양주시", Coord(37.6360, 127.2165))
        put("경기|오산시", Coord(37.1499, 127.0773))
        put("경기|시흥시", Coord(37.3800, 126.8028))
        put("경기|군포시", Coord(37.3616, 126.9352))
        put("경기|의왕시", Coord(37.3446, 126.9683))
        put("경기|하남시", Coord(37.5393, 127.2149))
        put("경기|용인시", Coord(37.2411, 127.1776))
        put("경기|파주시", Coord(37.7599, 126.7800))
        put("경기|이천시", Coord(37.2721, 127.4350))
        put("경기|안성시", Coord(37.0080, 127.2797))
        put("경기|김포시", Coord(37.6152, 126.7156))
        put("경기|화성시", Coord(37.1996, 126.8310))
        put("경기|광주시", Coord(37.4292, 127.2551))
        put("경기|양주시", Coord(37.7852, 127.0458))
        put("경기|포천시", Coord(37.8949, 127.2003))
        put("경기|여주시", Coord(37.2983, 127.6371))
        put("경기|연천군", Coord(38.0965, 127.0748))
        put("경기|가평군", Coord(37.8315, 127.5106))
        put("경기|양평군", Coord(37.4917, 127.4876))
    }
}
