import type {
  AuthCodeRequest,
  ChatSession,
  ConfirmMockPaymentRequest,
  CreatePaymentQuoteRequest,
  CreateSessionRequest,
  GuestParticipant,
  JoinSessionRequest,
  LoginRequest,
  LoginResponse,
  Message,
  PaymentOrder,
  PaymentQuote,
  RealtimeEnvelope,
  SessionCapabilityGrant,
  SessionSummaryResponse,
  SignalPayload,
  SignedUploadResponse,
  TimerWindow,
  User
} from "./contracts";
import {
  MESSAGE_TYPE_VALUES,
  PARTICIPANT_ROLE_VALUES,
  PAYMENT_STATUS_VALUES,
  SESSION_CAPABILITY_VALUES,
  SESSION_STATE_VALUES,
  TIMER_WINDOW_KIND_VALUES
} from "./enums";
import { REALTIME_EVENT_VALUES } from "./events";

export type SchemaParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export interface RuntimeSchema<T> {
  readonly name: string;
  is(value: unknown): value is T;
  parse(value: unknown): T;
  safeParse(value: unknown): SchemaParseResult<T>;
}

function createSchema<T>(name: string, guard: (value: unknown) => value is T): RuntimeSchema<T> {
  return {
    name,
    is: guard,
    parse(value) {
      if (!guard(value)) {
        throw new TypeError(`Invalid ${name}`);
      }

      return value;
    },
    safeParse(value) {
      if (guard(value)) {
        return { success: true, data: value };
      }

      return { success: false, errors: [`Invalid ${name}`] };
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOptional<T>(value: unknown, guard: (value: unknown) => value is T): value is T | undefined {
  return value === undefined || guard(value);
}

function isNullable<T>(value: unknown, guard: (value: unknown) => value is T): value is T | null {
  return value === null || guard(value);
}

function isArrayOf<T>(value: unknown, guard: (value: unknown) => value is T): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

function isIsoDateString(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

function createLiteralGuard<TValue extends string>(values: readonly TValue[]) {
  const allowed = new Set<string>(values);

  return (value: unknown): value is TValue => isString(value) && allowed.has(value);
}

export const isSessionState = createLiteralGuard(SESSION_STATE_VALUES);
export const isSessionCapability = createLiteralGuard(SESSION_CAPABILITY_VALUES);
export const isParticipantRole = createLiteralGuard(PARTICIPANT_ROLE_VALUES);
export const isMessageType = createLiteralGuard(MESSAGE_TYPE_VALUES);
export const isPaymentStatus = createLiteralGuard(PAYMENT_STATUS_VALUES);
export const isTimerWindowKind = createLiteralGuard(TIMER_WINDOW_KIND_VALUES);
export const isRealtimeEventType = createLiteralGuard(REALTIME_EVENT_VALUES);

export function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.phone) &&
    isString(value.displayName) &&
    isIsoDateString(value.createdAt)
  );
}

export function isGuestParticipant(value: unknown): value is GuestParticipant {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.displayName) &&
    isIsoDateString(value.joinedAt)
  );
}

export function isTimerWindow(value: unknown): value is TimerWindow {
  return (
    isRecord(value) &&
    isTimerWindowKind(value.kind) &&
    isIsoDateString(value.startsAt) &&
    isIsoDateString(value.endsAt)
  );
}

export function isPaymentQuote(value: unknown): value is PaymentQuote {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.sessionId) &&
    isArrayOf(value.capabilities, isSessionCapability) &&
    isNumber(value.durationMinutes) &&
    isNumber(value.amountCents) &&
    isString(value.qrPayload) &&
    isPaymentStatus(value.status) &&
    isIsoDateString(value.createdAt)
  );
}

export function isPaymentOrder(value: unknown): value is PaymentOrder {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.sessionId) &&
    isString(value.quoteId) &&
    isNumber(value.amountCents) &&
    isPaymentStatus(value.status) &&
    isOptional(value.paidAt, isIsoDateString) &&
    isIsoDateString(value.createdAt)
  );
}

export function isMessage(value: unknown): value is Message {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.sessionId) &&
    isString(value.senderId) &&
    isParticipantRole(value.senderRole) &&
    isMessageType(value.type) &&
    isOptional(value.text, isString) &&
    isOptional(value.mediaUrl, isString) &&
    isOptional(value.previewUrl, isString) &&
    isOptional(value.paymentQuoteId, isString) &&
    isIsoDateString(value.createdAt)
  );
}

export function isChatSession(value: unknown): value is ChatSession {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.initiatorId) &&
    isString(value.initiatorDisplayName) &&
    isString(value.joinToken) &&
    isString(value.joinUrl) &&
    isSessionState(value.state) &&
    isIsoDateString(value.createdAt) &&
    isIsoDateString(value.updatedAt) &&
    isNullable(value.guest, isGuestParticipant) &&
    isNullable(value.currentWindow, isTimerWindow) &&
    isArrayOf(value.enabledCapabilities, isSessionCapability) &&
    (value.pendingQuoteId === null || isString(value.pendingQuoteId))
  );
}

export function isSessionCapabilityGrant(value: unknown): value is SessionCapabilityGrant {
  return (
    isRecord(value) &&
    isString(value.sessionId) &&
    isArrayOf(value.enabled, isSessionCapability) &&
    isTimerWindowKind(value.source) &&
    isIsoDateString(value.startsAt) &&
    isIsoDateString(value.endsAt)
  );
}

export function isAuthCodeRequest(value: unknown): value is AuthCodeRequest {
  return isRecord(value) && isString(value.phone);
}

export function isLoginRequest(value: unknown): value is LoginRequest {
  return isRecord(value) && isString(value.phone) && isString(value.code);
}

export function isLoginResponse(value: unknown): value is LoginResponse {
  return isRecord(value) && isString(value.token) && isUser(value.user) && isString(value.mockCode);
}

export function isCreateSessionRequest(value: unknown): value is CreateSessionRequest {
  return isRecord(value) && isOptional(value.initiatorDisplayName, isString);
}

export function isJoinSessionRequest(value: unknown): value is JoinSessionRequest {
  return isRecord(value) && isString(value.displayName);
}

export function isCreatePaymentQuoteRequest(value: unknown): value is CreatePaymentQuoteRequest {
  return (
    isRecord(value) &&
    isArrayOf(value.capabilities, isSessionCapability) &&
    isNumber(value.durationMinutes)
  );
}

export function isConfirmMockPaymentRequest(value: unknown): value is ConfirmMockPaymentRequest {
  return isRecord(value) && isString(value.sessionId) && isString(value.quoteId);
}

export function isSignedUploadResponse(value: unknown): value is SignedUploadResponse {
  return (
    isRecord(value) &&
    isString(value.key) &&
    isString(value.uploadUrl) &&
    isString(value.publicUrl) &&
    isNumber(value.expiresInSeconds)
  );
}

export function isSessionSummaryResponse(value: unknown): value is SessionSummaryResponse {
  return (
    isRecord(value) &&
    isChatSession(value.session) &&
    isArrayOf(value.messages, isMessage) &&
    isArrayOf(value.quotes, isPaymentQuote)
  );
}

export function isRealtimeEnvelope(value: unknown): value is RealtimeEnvelope {
  return (
    isRecord(value) &&
    isRealtimeEventType(value.type) &&
    isString(value.sessionId) &&
    Object.prototype.hasOwnProperty.call(value, "payload")
  );
}

export function isSignalPayload(value: unknown): value is SignalPayload {
  return (
    isRecord(value) &&
    isString(value.sessionId) &&
    isString(value.fromParticipantId) &&
    isOptional(value.targetParticipantId, isString) &&
    isOptional(value.sdp, isRecord) &&
    isOptional(value.candidate, isRecord)
  );
}

export const UserSchema = createSchema<User>("User", isUser);
export const GuestParticipantSchema = createSchema<GuestParticipant>("GuestParticipant", isGuestParticipant);
export const TimerWindowSchema = createSchema<TimerWindow>("TimerWindow", isTimerWindow);
export const PaymentQuoteSchema = createSchema<PaymentQuote>("PaymentQuote", isPaymentQuote);
export const PaymentOrderSchema = createSchema<PaymentOrder>("PaymentOrder", isPaymentOrder);
export const MessageSchema = createSchema<Message>("Message", isMessage);
export const ChatSessionSchema = createSchema<ChatSession>("ChatSession", isChatSession);
export const SessionCapabilityGrantSchema = createSchema<SessionCapabilityGrant>(
  "SessionCapabilityGrant",
  isSessionCapabilityGrant
);
export const AuthCodeRequestSchema = createSchema<AuthCodeRequest>("AuthCodeRequest", isAuthCodeRequest);
export const LoginRequestSchema = createSchema<LoginRequest>("LoginRequest", isLoginRequest);
export const LoginResponseSchema = createSchema<LoginResponse>("LoginResponse", isLoginResponse);
export const CreateSessionRequestSchema = createSchema<CreateSessionRequest>("CreateSessionRequest", isCreateSessionRequest);
export const JoinSessionRequestSchema = createSchema<JoinSessionRequest>("JoinSessionRequest", isJoinSessionRequest);
export const CreatePaymentQuoteRequestSchema = createSchema<CreatePaymentQuoteRequest>(
  "CreatePaymentQuoteRequest",
  isCreatePaymentQuoteRequest
);
export const ConfirmMockPaymentRequestSchema = createSchema<ConfirmMockPaymentRequest>(
  "ConfirmMockPaymentRequest",
  isConfirmMockPaymentRequest
);
export const SignedUploadResponseSchema = createSchema<SignedUploadResponse>(
  "SignedUploadResponse",
  isSignedUploadResponse
);
export const SessionSummaryResponseSchema = createSchema<SessionSummaryResponse>(
  "SessionSummaryResponse",
  isSessionSummaryResponse
);
export const RealtimeEnvelopeSchema = createSchema<RealtimeEnvelope>("RealtimeEnvelope", isRealtimeEnvelope);
export const SignalPayloadSchema = createSchema<SignalPayload>("SignalPayload", isSignalPayload);
