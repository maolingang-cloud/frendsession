import type {
  ChatSession,
  ConfirmMockPaymentRequest,
  CreatePaymentQuoteRequest,
  LoginRequest,
  LoginResponse,
  Message,
  PaymentOrder,
  PaymentQuote,
  SessionSummaryResponse,
  SignedUploadResponse
} from "@frendseesion/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3301";

async function request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {})
      },
      cache: "no-store"
    });
  } catch {
    throw new Error(`无法连接到本地服务，请确认 API 已启动：${API_URL}`);
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { message?: string | string[]; error?: string };
      const detail = Array.isArray(payload.message) ? payload.message.join(", ") : payload.message;
      throw new Error(detail || payload.error || `请求失败：${response.status}`);
    }

    const message = await response.text();
    throw new Error(message || `请求失败：${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export function getApiHealth() {
  return request<{ ok: boolean; service: string; timestamp: string }>("/health");
}

export function requestCode(phone: string) {
  return request<{ ok: true; phone: string; mockCode: string; expiresInSeconds: number }>("/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ phone })
  });
}

export function login(body: LoginRequest) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function createSession(token: string, initiatorDisplayName?: string) {
  return request<ChatSession>("/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ initiatorDisplayName })
  });
}

export function getJoinPreview(joinToken: string) {
  return request<{
    sessionId: string;
    joinToken: string;
    joinUrl: string;
    initiatorDisplayName: string;
    state: ChatSession["state"];
    guestJoined: boolean;
  }>(`/sessions/join/${joinToken}`);
}

export function joinSession(sessionId: string, displayName: string) {
  return request<SessionSummaryResponse>(`/sessions/${sessionId}/join`, {
    method: "POST",
    body: JSON.stringify({ displayName })
  });
}

export function getSessionSummary(sessionId: string) {
  return request<SessionSummaryResponse>(`/sessions/${sessionId}`);
}

export function createPaymentQuote(
  token: string,
  sessionId: string,
  body: CreatePaymentQuoteRequest & { title?: string }
) {
  return request<PaymentQuote>(`/sessions/${sessionId}/payment-quotes`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
}

export function createMessage(sessionId: string, body: {
  senderId: string;
  senderRole: "initiator" | "guest";
  type: "text" | "image" | "video";
  text?: string;
  mediaUrl?: string;
  previewUrl?: string;
}) {
  return request<Message>(`/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function confirmMockPayment(body: ConfirmMockPaymentRequest) {
  return request<{ order: PaymentOrder; quote: PaymentQuote; session: ChatSession }>("/payments/mock/confirm", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function signUpload(fileName: string, mimeType: string) {
  return request<SignedUploadResponse>("/uploads/sign", {
    method: "POST",
    body: JSON.stringify({ fileName, mimeType })
  });
}
