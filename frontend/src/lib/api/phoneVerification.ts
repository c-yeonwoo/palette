/**
 * Phone Verification API
 */

import { api } from './apiClient';

interface SendVerificationCodeResponse {
  success: boolean;
  message: string;
  phoneNumber: string | null;
  expiresAt: string | null;
}

interface VerifyCodeResponse {
  success: boolean;
  message: string;
  phoneNumber: string | null;
}

/**
 * Send verification code to phone number
 */
export async function sendVerificationCode(
  phoneNumber: string,
  // 가입 흐름에서 true — 이미 가입된 번호면 백엔드가 발송 차단 + 중복 메시지 반환
  blockIfRegistered = false,
): Promise<SendVerificationCodeResponse> {
  return api.post<SendVerificationCodeResponse>(
    '/api/v1/verification/phone/send',
    { phoneNumber, blockIfRegistered },
    { requiresAuth: false }
  );
}

/**
 * Verify phone with code
 */
export async function verifyCode(
  phoneNumber: string,
  code: string,
  userId?: string
): Promise<VerifyCodeResponse> {
  return api.post<VerifyCodeResponse>(
    '/api/v1/verification/phone/verify',
    { phoneNumber, code, userId },
    { requiresAuth: false }
  );
}
