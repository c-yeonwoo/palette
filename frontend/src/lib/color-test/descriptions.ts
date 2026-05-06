/**
 * Palette — Color Type 결과 설명 데이터
 *
 * 8가지 컬러 타입 각각에 대해:
 * - 제목, 부제목, 설명 (2~3문장)
 * - 성격 키워드 3개
 * - 잘 맞는 타입 2개, 조심할 타입 1개
 * - 데이팅 특성 한 줄
 */

import type { ColorTypeKey } from "../colorTypes";

/** 컬러 타입 상세 설명 */
export interface ColorTypeDescription {
  /** 컬러 타입 키 */
  key: ColorTypeKey;
  /** 한국어 제목 (예: "따뜻한 오렌지") */
  title: string;
  /** 짧은 부제목 (예: "열정적이고 관계를 소중히 여기는") */
  subtitle: string;
  /** 2~3문장 성격 설명 */
  description: string;
  /** 성격 키워드 3개 */
  keywords: [string, string, string];
  /** 잘 맞는 컬러 타입 2가지 */
  compatibleTypes: [ColorTypeKey, ColorTypeKey];
  /** 조심할 컬러 타입 1가지 */
  challengeType: ColorTypeKey;
  /** 데이팅 특성 한 줄 */
  trait: string;
}

/** 8가지 컬러 타입 전체 설명 */
export const COLOR_TYPE_DESCRIPTIONS: Record<
  ColorTypeKey,
  ColorTypeDescription
> = {
  orange: {
    key: "orange",
    title: "따뜻한 오렌지",
    subtitle: "열정적이고 관계를 소중히 여기는",
    description:
      "어디서나 자연스럽게 분위기를 이끌며 사람들과의 연결에서 활력을 얻는 타입입니다. 감정 표현이 풍부하고 상대방을 편안하게 해주는 능력이 있어 첫 만남에서도 금세 친해집니다. 열정적으로 관계에 투자하며, 함께할 때 진심 어린 온기를 전합니다.",
    keywords: ["열정", "친화", "활력"],
    compatibleTypes: ["blue", "gray"],
    challengeType: "purple",
    trait: "먼저 연락하고, 먼저 마음을 여는 데이팅 스타일",
  },

  blue: {
    key: "blue",
    title: "차분한 블루",
    subtitle: "신중하고 신뢰를 쌓아가는",
    description:
      "감정보다 논리를 앞세우며 천천히 깊어지는 관계를 선호하는 타입입니다. 처음에는 다가가기 어려워 보여도, 한번 신뢰를 쌓으면 굉장히 안정적이고 믿음직한 파트너가 됩니다. 약속을 철저히 지키고 상대방에 대한 깊은 이해를 바탕으로 관계를 이어갑니다.",
    keywords: ["신뢰", "안정", "이성"],
    compatibleTypes: ["orange", "red"],
    challengeType: "yellow",
    trait: "천천히 그러나 확실하게 마음을 여는 데이팅 스타일",
  },

  red: {
    key: "red",
    title: "강한 레드",
    subtitle: "주도적이고 목표를 향해 달려가는",
    description:
      "명확한 목표의식과 강한 추진력으로 원하는 것을 향해 거침없이 나아가는 타입입니다. 연애에서도 자신의 감정에 솔직하며, 상대에게 먼저 적극적으로 다가가는 편입니다. 강렬한 에너지로 관계에 몰입하지만, 때로는 상대의 페이스를 배려하는 여유가 필요합니다.",
    keywords: ["추진력", "용기", "강렬함"],
    compatibleTypes: ["blue", "green"],
    challengeType: "pink",
    trait: "원하면 직접 말하고 행동으로 보여주는 데이팅 스타일",
  },

  pink: {
    key: "pink",
    title: "다정한 핑크",
    subtitle: "공감 능력이 뛰어나고 돌봄을 좋아하는",
    description:
      "상대방의 감정을 세심하게 포착하고 깊이 공감하는 능력이 탁월한 타입입니다. 관계에서 상대가 편안하고 행복하도록 자연스럽게 배려하며, 분위기를 따뜻하게 만드는 재능이 있습니다. 감성적인 연결을 중시하며, 작은 순간들을 소중히 기억하는 로맨티스트입니다.",
    keywords: ["따뜻함", "감성", "배려"],
    compatibleTypes: ["gray", "purple"],
    challengeType: "red",
    trait: "세심한 배려와 감성적 공감으로 마음을 사로잡는 데이팅 스타일",
  },

  green: {
    key: "green",
    title: "편안한 그린",
    subtitle: "균형을 중시하고 자연스러운 관계를 만드는",
    description:
      "억지스럽지 않게 자연스러운 흐름 속에서 안정적인 관계를 만들어가는 타입입니다. 급하지 않게 서로를 알아가며, 편안함과 진정성을 바탕으로 신뢰를 쌓습니다. 갈등 상황에서도 균형 잡힌 시각을 유지하며 현명하게 문제를 해결해나갑니다.",
    keywords: ["균형", "안정", "자연"],
    compatibleTypes: ["yellow", "orange"],
    challengeType: "red",
    trait: "있는 그대로의 모습으로 편안함을 주는 데이팅 스타일",
  },

  purple: {
    key: "purple",
    title: "몽환 퍼플",
    subtitle: "창의적이고 깊은 감성을 가진",
    description:
      "독창적인 시각과 풍부한 감수성으로 세상을 바라보는 타입입니다. 평범한 것에서 특별함을 발견하는 능력이 있으며, 깊이 있는 대화와 감성적인 경험을 함께 나누기를 좋아합니다. 예측 불가능한 매력으로 상대방의 호기심을 자극하며 독특한 로맨스를 만들어냅니다.",
    keywords: ["창의성", "예술", "독창성"],
    compatibleTypes: ["pink", "yellow"],
    challengeType: "gray",
    trait: "특별한 경험과 깊은 감성으로 기억에 남는 데이팅 스타일",
  },

  yellow: {
    key: "yellow",
    title: "밝은 옐로우",
    subtitle: "밝고 유쾌하며 호기심이 넘치는",
    description:
      "어디서든 밝은 에너지로 주변을 환하게 만드는 타입입니다. 새로운 것에 대한 왕성한 호기심으로 상대방과 함께 다양한 경험을 즐기며, 매 순간을 즐겁고 유쾌하게 만드는 재능이 있습니다. 긍정적인 에너지로 관계를 활기차게 유지하며 함께 있는 시간이 즐거운 파트너입니다.",
    keywords: ["낙천", "호기심", "유쾌함"],
    compatibleTypes: ["purple", "green"],
    challengeType: "blue",
    trait: "웃음과 설렘으로 함께하는 매 순간을 특별하게 만드는 데이팅 스타일",
  },

  gray: {
    key: "gray",
    title: "단단한 그레이",
    subtitle: "신중하고 깊이 있는 내공을 가진",
    description:
      "섣불리 나서지 않고 상황을 꿰뚫어 보는 통찰력과 안정감이 있는 타입입니다. 말보다 행동으로 신뢰를 쌓으며, 한번 마음을 주면 끝까지 책임감 있게 함께합니다. 겉은 차분해 보이지만 내면에 강한 의지와 깊은 감정을 품고 있어, 천천히 알아갈수록 매력이 빛납니다.",
    keywords: ["신중함", "내공", "실용성"],
    compatibleTypes: ["orange", "pink"],
    challengeType: "purple",
    trait: "묵묵히 곁을 지키며 행동으로 사랑을 표현하는 데이팅 스타일",
  },
};
