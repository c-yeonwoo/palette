/**
 * 색별 위클리 인사이트 SoT — L-001.
 *
 * 정적 풀에서 ISO 주차로 인덱싱해 매주 다른 인사이트 노출.
 * 데이터는 향후 운영자 콘텐츠 / LLM 생성으로 확장 가능 (현재는 정적 4개씩).
 *
 * 각 색 4개 풀 = 4주 rotation. 1년이면 ~12회 같은 인사이트 반복.
 */
import type { ColorType } from "./colorCompatibility";

export interface ColorInsight {
  /** 한 줄 헤드라인 (10~20자) */
  headline: string;
  /** 본문 — 이번 주 연애·관계 관점의 짧은 코칭 (50~80자) */
  body: string;
  /** 어울리는 액션 1개 (옵셔널) */
  action?: string;
}

const POOLS: Record<ColorType, ColorInsight[]> = {
  WARM_ORANGE: [
    {
      headline: "에너지가 빛나는 한 주",
      body: "당신의 활기는 사람들을 끌어당기는 자석이에요. 새로운 인연에 먼저 손 내밀어보세요.",
      action: "지인 1명에게 안부 메시지 보내기",
    },
    {
      headline: "외향성에도 휴식이 필요해요",
      body: "주변을 환하게 비추는 만큼 스스로의 마음도 챙기세요. 혼자만의 카페 타임을 가져보세요.",
    },
    {
      headline: "솔직함이 무기예요",
      body: "꾸미지 않은 모습이 가장 매력적인 색. 첫 만남에서 진솔한 한 마디를 던져보세요.",
    },
    {
      headline: "도전을 두려워하지 않는 색",
      body: "이번 주 한 번도 가본 적 없는 데이트 장소를 제안해보세요. 새로운 추억이 색을 더해요.",
    },
  ],
  CALM_BLUE: [
    {
      headline: "깊이 있는 대화의 주간",
      body: "당신의 차분함은 상대를 편하게 만들어요. 진심 어린 질문 하나로 관계가 깊어져요.",
      action: "최근 인상 깊었던 책·영화 한 마디로 공유",
    },
    {
      headline: "혼자만의 시간도 충전이에요",
      body: "관계에 지쳤다면 잠시 쉬어가도 괜찮아요. 깊이는 양보다 질에서 나옵니다.",
    },
    {
      headline: "신중함이 신뢰가 돼요",
      body: "느리지만 단단한 관계를 만드는 게 당신의 강점. 서두르지 마세요.",
    },
    {
      headline: "이번 주는 듣는 사람",
      body: "당신의 경청은 누군가에겐 큰 위로예요. 친구의 이야기를 끝까지 들어보세요.",
    },
  ],
  VIBRANT_RED: [
    {
      headline: "열정이 통하는 한 주",
      body: "당신의 추진력이 관계를 빠르게 진전시킬 때. 단, 상대의 페이스도 살펴주세요.",
      action: "마음 가는 사람에게 데이트 일정 먼저 제안",
    },
    {
      headline: "강함 속의 부드러움",
      body: "강한 인상 뒤의 섬세함을 보여주세요. 의외성은 매력의 핵심이에요.",
    },
    {
      headline: "목표 지향의 매력",
      body: "꿈을 이야기하는 당신은 빛나요. 이번 주 가까운 목표 하나를 공유해보세요.",
    },
    {
      headline: "감정 표현은 분명하게",
      body: "당신의 직진은 솔직함이에요. 우물쭈물 대신 마음을 명확히 전해보세요.",
    },
  ],
  SOFT_PINK: [
    {
      headline: "공감이 인연을 만들어요",
      body: "당신의 따뜻함은 모두의 안식처. 이번 주 누군가에게 진심 어린 위로를 건네보세요.",
      action: "친구의 SNS에 다정한 댓글 남기기",
    },
    {
      headline: "자신에게도 다정하게",
      body: "남을 챙기는 만큼 본인도 챙겨주세요. 좋아하는 디저트로 작은 보상을.",
    },
    {
      headline: "부드러움이 강함이에요",
      body: "당신의 온화함은 깊은 관계를 만드는 핵심. 첫 만남에서 미소 한 번이 큰 차이를 만들어요.",
    },
    {
      headline: "감수성을 신뢰하세요",
      body: "직감이 잘 맞는 한 주. 처음 만난 사람에 대한 첫인상을 믿어보세요.",
    },
  ],
  FRESH_GREEN: [
    {
      headline: "성장하는 관계의 주간",
      body: "함께 배우고 성장할 수 있는 사람과 잘 맞아요. 공통 관심사를 가진 분에게 다가가보세요.",
      action: "관심 분야 클래스·전시 추천 메시지 보내기",
    },
    {
      headline: "균형감이 매력이에요",
      body: "당신의 안정감은 누군가에게 큰 평온. 서두르지 않는 페이스를 유지하세요.",
    },
    {
      headline: "자연 속에서 시작하는 인연",
      body: "이번 주 산책·공원 데이트가 잘 맞아요. 자연이 두 사람을 부드럽게 이어줘요.",
    },
    {
      headline: "꾸준함이 차이를 만들어요",
      body: "매일 작은 관심이 큰 관계를 만들어요. 진행 중인 대화에 짧은 안부 한 줄.",
    },
  ],
  ELEGANT_PURPLE: [
    {
      headline: "독창성이 빛나요",
      body: "당신만의 시선과 취향은 누군가에게 신선함. 좋아하는 음악·예술을 자연스럽게 공유해보세요.",
      action: "최근 발견한 플레이리스트 공유",
    },
    {
      headline: "신비함을 유지하세요",
      body: "한 번에 다 보여주지 않는 매력. 천천히 알아가는 즐거움을 두 사람에게 선물하세요.",
    },
    {
      headline: "감각적인 한 주",
      body: "전시·공연·새 카페 — 감각이 살아나는 장소가 잘 맞아요. 인연에게도 같이 가자 청해보세요.",
    },
    {
      headline: "자기 세계를 지키되 열어두기",
      body: "혼자의 시간을 존중하면서도 누군가를 초대할 여유를 만들어요.",
    },
  ],
  BRIGHT_YELLOW: [
    {
      headline: "긍정이 전염되는 한 주",
      body: "당신의 밝음은 주변을 환하게 해요. 망설이지 말고 마음에 드는 사람에게 인사 먼저.",
      action: "오늘 좋았던 일 1개를 친구에게 공유",
    },
    {
      headline: "유머가 다리예요",
      body: "가벼운 농담 한 마디가 어색함을 녹여요. 첫 메시지에 가벼운 유머를 시도해보세요.",
    },
    {
      headline: "낙천성에 깊이를 더하세요",
      body: "밝은 만큼 진지한 대화도 균형 있게. 인생관·가치관을 솔직히 나누는 시점.",
    },
    {
      headline: "당신은 누군가의 햇살",
      body: "오랜만에 안부가 궁금한 친구가 있다면 먼저 연락. 작은 햇살이 관계를 다시 데워요.",
    },
  ],
  SOPHISTICATED_GRAY: [
    {
      headline: "세련됨이 안목으로",
      body: "당신의 절제된 매력은 깊이 있는 인연에게 통해요. 굳이 꾸미지 않은 모습을 보여주세요.",
      action: "오늘 입은 옷·읽은 책 한 줄 공유",
    },
    {
      headline: "차분함이 신뢰의 기반",
      body: "감정에 휘둘리지 않는 당신은 누군가의 든든한 기둥. 그 모습 그대로가 매력이에요.",
    },
    {
      headline: "혼자도 둘도 잘 어울리는 색",
      body: "독립적인 만큼 누군가와의 시간도 즐길 줄 알아요. 이번 주 균형 잡기에 신경 써보세요.",
    },
    {
      headline: "조용한 진정성",
      body: "말이 많지 않아도 마음이 깊다는 걸 보여줄 시점. 짧지만 정성 들인 메시지가 효과적이에요.",
    },
  ],
};

/** 1970-01-01 부터 경과된 주차로 인덱싱 (ISO 주 단위). */
function currentWeekIndex(date: Date = new Date()): number {
  const ms = date.getTime();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Math.floor(ms / weekMs);
}

/**
 * 사용자의 색 타입과 현재 주차 기준 인사이트 1개 반환.
 * 색 미정이면 null.
 */
export function getWeeklyInsight(
  color: ColorType | null | undefined,
  date: Date = new Date(),
): ColorInsight | null {
  if (!color) return null;
  const pool = POOLS[color];
  if (!pool || pool.length === 0) return null;
  return pool[currentWeekIndex(date) % pool.length];
}
