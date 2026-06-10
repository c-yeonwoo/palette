/**
 * Toss Payments SDK 래퍼 — PA-012.
 *
 * 흐름:
 *  1) [BillingScreen] 묶음 선택 → buildOrder(kind, quantity, priceWon)
 *  2) [TossPayments SDK] requestPayment(...) — 결제 위젯 → successUrl/failUrl 리다이렉트
 *  3) [PaymentSuccessScreen] URL ?paymentKey&orderId&amount 추출 → /api/v1/billing/checkout/confirm
 *
 * 환경:
 *  - VITE_TOSS_CLIENT_KEY — test_ck_... / live_ck_...
 *  - 미설정 시 isPaymentEnabled() === false, BillingScreen 에 안내 토스트
 */
import { loadTossPayments } from "@tosspayments/payment-sdk";

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined;

export function isPaymentEnabled(): boolean {
  return !!CLIENT_KEY && CLIENT_KEY.startsWith("test_ck_") || (CLIENT_KEY?.startsWith("live_ck_") ?? false);
}

export type BillingKind = "VIEW" | "INTRO_REQUEST";

export interface OrderRequest {
  kind: BillingKind;
  quantity: number;       // 1 / 5 / 10
  amount: number;         // 원
}

// orderName 은 Toss 결제창에 노출 — 사용자에게 보이는 문자열.
// ADR 0042 단일 잔액 모델 이후 kind 는 사실상 의미 없음 (모두 "물감 충전").
const KIND_LABEL: Record<BillingKind, string> = {
  VIEW: "팔레트 물감",
  INTRO_REQUEST: "팔레트 물감",
};

/**
 * Toss 결제 위젯 호출. 결제 성공 시 successUrl 로 리다이렉트되며 URL 에
 * paymentKey/orderId/amount 가 query string 으로 붙는다.
 *
 * 실패·취소 시 failUrl 로 동일 query string + ?code=ERROR_CODE&message=...
 *
 * 주의: Toss SDK 는 webview/SPA 에서도 동작하나 successUrl/failUrl 은
 * 동일 origin 의 별도 라우트여야 함 (App.tsx 의 PaymentSuccess/Fail 화면).
 */
export async function requestTossPayment(order: OrderRequest, customerKey: string): Promise<void> {
  if (!CLIENT_KEY) {
    throw new Error("결제가 아직 설정되지 않았어요 (VITE_TOSS_CLIENT_KEY 미설정)");
  }
  const toss = await loadTossPayments(CLIENT_KEY);
  const orderId = generateOrderId(order.kind, order.quantity);
  const origin = window.location.origin;

  await toss.requestPayment("카드", {
    amount: order.amount,
    orderId,
    orderName: `${KIND_LABEL[order.kind]} ${order.quantity.toLocaleString("ko-KR")} 충전`,
    successUrl: `${origin}/payment-success?kind=${order.kind}&quantity=${order.quantity}`,
    failUrl: `${origin}/payment-fail`,
    customerKey,
    // 영수증 이메일은 백엔드에서 토스 콘솔 매핑으로 받도록 — 위젯엔 전달 X
  });
}

/**
 * orderId — 가맹점이 생성하는 고유 ID. Toss 정책상 6~64자.
 * 형식: palette-{kind}-{quantity}-{timestamp}-{random6}
 */
function generateOrderId(kind: BillingKind, quantity: number): string {
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 8);
  return `palette-${kind.toLowerCase()}-${quantity}-${ts}-${rnd}`;
}

/**
 * URL query string 에서 결제 결과 파싱 (PaymentSuccess/Fail 화면용).
 */
export interface TossSuccessParams {
  paymentKey: string;
  orderId: string;
  amount: number;
  kind: BillingKind;
  quantity: number;
}

export function parseTossSuccessUrl(search: string): TossSuccessParams | null {
  const params = new URLSearchParams(search);
  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = Number(params.get("amount"));
  const kind = params.get("kind") as BillingKind | null;
  const quantity = Number(params.get("quantity"));
  if (!paymentKey || !orderId || !amount || !kind || !quantity) return null;
  return { paymentKey, orderId, amount, kind, quantity };
}
