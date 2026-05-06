/**
 * content-guard.ts — F03 메시지 입력 가드
 *
 * 사용:
 *   const { ok, warnings } = checkMessage(inputText);
 *   if (!ok) showWarning(warnings[0]);
 */

// 연락처 패턴
const CONTACT_PATTERNS = [
  /010[-\s]?\d{3,4}[-\s]?\d{4}/,          // 휴대폰
  /\d{2,3}[-\s]\d{3,4}[-\s]\d{4}/,        // 일반전화
  /카[카톡]?\s?[아이]?[디]?\s?[:：]?\s?\S+/, // 카카오톡 ID
  /카톡\s*[:：]?\s*\S+/,
  /카카오\s*[:：]?\s*\S+/,
  /오픈채팅/,
  /인스타\s*[:：]?\s*@?\S+/,              // 인스타그램
  /instagram\s*[:：]?\s*@?\S+/i,
  /@[a-zA-Z0-9_.]{3,}/,                    // SNS 핸들
  /t\.me\/\S+/i,                           // 텔레그램
  /\blineapp\b/i,
  /라인\s*[:：]?\s*\S+/,
];

// 외부 링크
const URL_PATTERN = /https?:\/\/\S+|www\.\S+\.\S+/i;

// 욕설 패턴 (기본 30개 + 변형 처리용 정규식)
const PROFANITY_PATTERNS = [
  /씨발/,  /시발/,  /ㅅㅂ/,   /ㅆㅂ/,
  /개새/,  /개새끼/, /개소리/,
  /병신/,  /ㅂㅅ/,
  /지랄/,
  /꺼져/,
  /닥쳐/,
  /미친/,  /미놈/,  /미년/,
  /보지/,  /보짓/,
  /자지/,  /자짓/,
  /창녀/,  /창년/,
  /걸레/,
  /fuck/i, /shit/i, /bitch/i, /asshole/i, /bastard/i,
  /sex/i,  /porn/i,
];

export interface GuardResult {
  ok: boolean;
  warnings: string[];
}

export function checkMessage(text: string): GuardResult {
  const warnings: string[] = [];

  for (const pattern of CONTACT_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push("앱 외부 연락처(전화번호, SNS ID 등)는 공유할 수 없어요.");
      break;
    }
  }

  if (URL_PATTERN.test(text)) {
    warnings.push("외부 링크는 보안상 사용할 수 없어요.");
  }

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push("다른 분들이 불쾌할 수 있는 표현이 포함되어 있어요.");
      break;
    }
  }

  return { ok: warnings.length === 0, warnings };
}

/** 카메라 촬영 파일 (F04)에서도 이미지 설명 텍스트 가드에 재사용 가능 */
export function checkProfileText(text: string): GuardResult {
  return checkMessage(text);
}
