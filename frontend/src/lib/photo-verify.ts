/**
 * photo-verify.ts — F04 사진 본인 인증 mock
 *
 * 추후 비전 API(Google Vision / OpenAI Vision)로 교체 가능.
 * 인터페이스만 고정하고 내부 구현을 swap.
 *
 * 사용:
 *   const result = await verifySelfies(profilePhotoDataUrl, selfieDataUrls);
 *   if (result.ok) markVerified(userId);
 */

export interface VerifyResult {
  ok: boolean;
  score: number;           // 0-100 (실제 구현 시 얼굴 매칭 유사도)
  failReason?: "face_not_visible" | "lighting" | "angle" | "liveness_failed";
}

export type PhotoVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "failed";

export interface PhotoVerification {
  userId: string;
  status: PhotoVerificationStatus;
  verifiedAt?: string;
  attemptCount: number;
}

/**
 * 셀카 검증 (mock).
 * 실제 구현에서는 profilePhotoDataUrl + selfieDataUrls[]를 Vision API로 전송.
 * 현재: 1.5초 딜레이 후 95% 확률로 success.
 */
export async function verifySelfies(
  _profilePhotoDataUrl: string,
  _selfieDataUrls: string[],
): Promise<VerifyResult> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const success = Math.random() < 0.95;
  if (success) {
    return { ok: true, score: 82 + Math.floor(Math.random() * 16) };
  }

  const reasons: VerifyResult["failReason"][] = [
    "face_not_visible",
    "lighting",
    "angle",
  ];
  return {
    ok: false,
    score: 30,
    failReason: reasons[Math.floor(Math.random() * reasons.length)],
  };
}

export function getFailReasonText(reason: VerifyResult["failReason"]): string {
  switch (reason) {
    case "face_not_visible": return "얼굴이 잘 보이지 않아요. 카메라를 얼굴 정면에 맞춰 주세요.";
    case "lighting":         return "조명이 너무 어둡거나 역광이에요. 밝은 곳에서 다시 시도해 주세요.";
    case "angle":            return "각도가 맞지 않아요. 가이드 원 안에 얼굴을 맞춰 주세요.";
    case "liveness_failed":  return "실제 얼굴이 감지되지 않았어요. 다시 시도해 주세요.";
    default:                 return "인증에 실패했어요. 다시 시도해 주세요.";
  }
}

// ── localStorage mock 저장소 ─────────────────────────────

const STORAGE_KEY = "palette_photo_verify";

export function getVerificationStatus(userId: string): PhotoVerification {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const store: Record<string, PhotoVerification> = raw ? JSON.parse(raw) : {};
    return store[userId] ?? { userId, status: "unverified", attemptCount: 0 };
  } catch {
    return { userId, status: "unverified", attemptCount: 0 };
  }
}

export function saveVerificationStatus(data: PhotoVerification): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const store: Record<string, PhotoVerification> = raw ? JSON.parse(raw) : {};
    store[data.userId] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}
