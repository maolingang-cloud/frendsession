import assert from "node:assert/strict";
import test from "node:test";
import { buildInitialSession, createFreeWindow, expireWindow, guestJoined, paymentConfirmed } from "./session-machine";
import type { ChatSession, PaymentQuote } from "./contracts";

test("guest join starts free text window", () => {
  const at = new Date("2026-03-19T10:00:00.000Z");
  const session = buildInitialSession({
    id: "session_1",
    initiatorId: "user_1",
    initiatorDisplayName: "发起方",
    joinToken: "join_1",
    joinUrl: "http://localhost:3000/join/join_1",
    at
  });

  const nextSession = guestJoined(
    session,
    {
      id: "guest_1",
      displayName: "接收端",
      joinedAt: at.toISOString()
    },
    at
  );

  assert.equal(nextSession.state, "free_text");
  assert.equal(nextSession.enabledCapabilities.join(","), "text");
  assert.equal(nextSession.currentWindow?.kind, "free");
});

test("paid window expiration falls back to free text window", () => {
  const at = new Date("2026-03-19T10:00:00.000Z");
  const session: ChatSession = {
    id: "session_2",
    initiatorId: "user_1",
    initiatorDisplayName: "发起方",
    joinToken: "join_2",
    joinUrl: "http://localhost:3000/join/join_2",
    state: "pending_payment",
    createdAt: at.toISOString(),
    updatedAt: at.toISOString(),
    guest: {
      id: "guest_1",
      displayName: "接收端",
      joinedAt: at.toISOString()
    },
    currentWindow: createFreeWindow(at),
    enabledCapabilities: ["text"],
    pendingQuoteId: "quote_1"
  };

  const quote: PaymentQuote = {
    id: "quote_1",
    sessionId: "session_2",
    capabilities: ["video_call"],
    durationMinutes: 10,
    amountCents: 1200,
    qrPayload: "pay://quote_1",
    status: "paid",
    createdAt: at.toISOString()
  };

  const paid = paymentConfirmed(session, quote, at);
  const afterExpiry = expireWindow(paid, new Date("2026-03-19T10:10:00.000Z"));

  assert.equal(afterExpiry.state, "free_text_return");
  assert.equal(afterExpiry.currentWindow?.kind, "free");
  assert.deepEqual(afterExpiry.enabledCapabilities, ["text"]);
});

test("free window expiration expires session", () => {
  const at = new Date("2026-03-19T10:00:00.000Z");
  const session: ChatSession = {
    id: "session_3",
    initiatorId: "user_1",
    initiatorDisplayName: "发起方",
    joinToken: "join_3",
    joinUrl: "http://localhost:3000/join/join_3",
    state: "free_text_return",
    createdAt: at.toISOString(),
    updatedAt: at.toISOString(),
    guest: {
      id: "guest_1",
      displayName: "接收端",
      joinedAt: at.toISOString()
    },
    currentWindow: createFreeWindow(at),
    enabledCapabilities: ["text"],
    pendingQuoteId: null
  };

  const expired = expireWindow(session, new Date("2026-03-19T10:03:00.000Z"));
  assert.equal(expired.state, "expired");
  assert.equal(expired.currentWindow, null);
  assert.deepEqual(expired.enabledCapabilities, []);
});
