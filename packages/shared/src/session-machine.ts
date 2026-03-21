import {
  ChatSession,
  CreatePaymentQuoteRequest,
  FREE_TEXT_DURATION_MINUTES,
  Message,
  PaymentQuote,
  SessionCapabilityGrant,
  TimerWindow
} from "./contracts";
import { SESSION_CAPABILITIES, type SessionCapability, type SessionState } from "./enums";

const FREE_TEXT_MS = FREE_TEXT_DURATION_MINUTES * 60 * 1000;

const CAPABILITY_WEIGHT_CENTS: Record<SessionCapability, number> = {
  text: 0,
  image_message: 25,
  video_message: 40,
  audio_call: 90,
  video_call: 120
};

export function uniqueCapabilities(capabilities: SessionCapability[]): SessionCapability[] {
  const allowed = new Set(SESSION_CAPABILITIES);
  return [...new Set(capabilities.filter((capability) => allowed.has(capability)))];
}

export function createFreeWindow(at: Date): TimerWindow {
  return {
    kind: "free",
    startsAt: at.toISOString(),
    endsAt: new Date(at.getTime() + FREE_TEXT_MS).toISOString()
  };
}

export function createPaidWindow(at: Date, durationMinutes: number): TimerWindow {
  return {
    kind: "paid",
    startsAt: at.toISOString(),
    endsAt: new Date(at.getTime() + durationMinutes * 60 * 1000).toISOString()
  };
}

export function buildInitialSession(input: {
  id: string;
  initiatorId: string;
  initiatorDisplayName: string;
  joinToken: string;
  joinUrl: string;
  at: Date;
}): ChatSession {
  const timestamp = input.at.toISOString();

  return {
    id: input.id,
    initiatorId: input.initiatorId,
    initiatorDisplayName: input.initiatorDisplayName,
    joinToken: input.joinToken,
    joinUrl: input.joinUrl,
    state: "waiting_for_guest",
    createdAt: timestamp,
    updatedAt: timestamp,
    guest: null,
    currentWindow: null,
    enabledCapabilities: ["text"],
    pendingQuoteId: null
  };
}

export function guestJoined(session: ChatSession, guest: ChatSession["guest"], at: Date): ChatSession {
  return {
    ...session,
    guest,
    state: "free_text",
    currentWindow: createFreeWindow(at),
    enabledCapabilities: ["text"],
    pendingQuoteId: null,
    updatedAt: at.toISOString()
  };
}

export function quoteCreated(session: ChatSession, quote: PaymentQuote, at: Date): ChatSession {
  return {
    ...session,
    state: "pending_payment",
    pendingQuoteId: quote.id,
    updatedAt: at.toISOString()
  };
}

export function paymentConfirmed(session: ChatSession, quote: PaymentQuote, at: Date): ChatSession {
  return {
    ...session,
    state: "paid_media",
    pendingQuoteId: null,
    currentWindow: createPaidWindow(at, quote.durationMinutes),
    enabledCapabilities: uniqueCapabilities(["text", ...quote.capabilities]),
    updatedAt: at.toISOString()
  };
}

export function expireWindow(session: ChatSession, at: Date): ChatSession {
  if (session.currentWindow?.kind === "paid") {
    return {
      ...session,
      state: "free_text_return",
      currentWindow: createFreeWindow(at),
      enabledCapabilities: ["text"],
      pendingQuoteId: null,
      updatedAt: at.toISOString()
    };
  }

  return {
    ...session,
    state: "expired",
    currentWindow: null,
    enabledCapabilities: [],
    pendingQuoteId: null,
    updatedAt: at.toISOString()
  };
}

export function getRemainingMs(session: ChatSession, now = new Date()): number {
  if (!session.currentWindow) {
    return 0;
  }

  return Math.max(new Date(session.currentWindow.endsAt).getTime() - now.getTime(), 0);
}

export function calculateQuoteAmount(input: CreatePaymentQuoteRequest): number {
  const capabilities = uniqueCapabilities(input.capabilities).filter((capability) => capability !== "text");
  const minuteCost = capabilities.reduce((total, capability) => total + CAPABILITY_WEIGHT_CENTS[capability], 0);

  return Math.max(100, minuteCost * input.durationMinutes);
}

export function buildGrant(session: ChatSession): SessionCapabilityGrant | null {
  if (!session.currentWindow) {
    return null;
  }

  return {
    sessionId: session.id,
    enabled: session.enabledCapabilities,
    source: session.currentWindow.kind,
    startsAt: session.currentWindow.startsAt,
    endsAt: session.currentWindow.endsAt
  };
}

export function buildSystemMessage(input: {
  id: string;
  sessionId: string;
  text: string;
  at: Date;
}): Message {
  return {
    id: input.id,
    sessionId: input.sessionId,
    senderId: "system",
    senderRole: "system",
    type: "system",
    text: input.text,
    createdAt: input.at.toISOString()
  };
}

export function canUseCapability(session: ChatSession, capability: SessionCapability): boolean {
  return session.enabledCapabilities.includes(capability);
}

export function isSessionActive(state: SessionState): boolean {
  return state !== "expired";
}
