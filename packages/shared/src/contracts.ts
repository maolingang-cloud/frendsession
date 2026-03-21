import type { RealtimeEventType } from "./events";
import type {
  MessageType,
  ParticipantRole,
  PaymentStatus,
  SessionCapability,
  SessionState,
  TimerWindowKind
} from "./enums";

export const FREE_TEXT_DURATION_MINUTES = 3;
export const SUPPORTED_PAID_DURATIONS = [5, 10, 15, 30] as const;

export interface User {
  id: string;
  phone: string;
  displayName: string;
  createdAt: string;
}

export interface GuestParticipant {
  id: string;
  displayName: string;
  joinedAt: string;
}

export interface TimerWindow {
  kind: TimerWindowKind;
  startsAt: string;
  endsAt: string;
}

export interface PaymentQuote {
  id: string;
  sessionId: string;
  capabilities: SessionCapability[];
  durationMinutes: number;
  amountCents: number;
  qrPayload: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface PaymentOrder {
  id: string;
  sessionId: string;
  quoteId: string;
  amountCents: number;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  senderRole: ParticipantRole;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  previewUrl?: string;
  paymentQuoteId?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  initiatorId: string;
  initiatorDisplayName: string;
  joinToken: string;
  joinUrl: string;
  state: SessionState;
  createdAt: string;
  updatedAt: string;
  guest: GuestParticipant | null;
  currentWindow: TimerWindow | null;
  enabledCapabilities: SessionCapability[];
  pendingQuoteId: string | null;
}

export interface SessionCapabilityGrant {
  sessionId: string;
  enabled: SessionCapability[];
  source: TimerWindowKind;
  startsAt: string;
  endsAt: string;
}

export interface AuthCodeRequest {
  phone: string;
}

export interface LoginRequest {
  phone: string;
  code: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  mockCode: string;
}

export interface CreateSessionRequest {
  initiatorDisplayName?: string;
}

export interface JoinSessionRequest {
  displayName: string;
}

export interface CreatePaymentQuoteRequest {
  capabilities: SessionCapability[];
  durationMinutes: number;
}

export interface ConfirmMockPaymentRequest {
  sessionId: string;
  quoteId: string;
}

export interface SignedUploadResponse {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
}

export interface SessionSummaryResponse {
  session: ChatSession;
  messages: Message[];
  quotes: PaymentQuote[];
}

export interface RealtimeEnvelope<TPayload = unknown> {
  type: RealtimeEventType;
  sessionId: string;
  payload: TPayload;
}

export interface SignalPayload {
  sessionId: string;
  fromParticipantId: string;
  targetParticipantId?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}
