import * as assert from "node:assert/strict";
import { buildInitialSession, createFreeWindow, expireWindow, guestJoined, paymentConfirmed } from "./session-machine";
import type { ChatSession, PaymentQuote } from "./contracts";

function runChecks() {
  const at = new Date("2026-03-19T10:00:00.000Z");

  const initial = buildInitialSession({
    id: "session_1",
    initiatorId: "user_1",
    initiatorDisplayName: "发起方",
    joinToken: "join_1",
    joinUrl: "http://localhost:3000/join/join_1",
    at
  });

  const joined = guestJoined(
    initial,
    {
      id: "guest_1",
      displayName: "接收端",
      joinedAt: at.toISOString()
    },
    at
  );

  assert.equal(joined.state, "free_text");
  assert.deepEqual(joined.enabledCapabilities, ["text"]);
  assert.equal(joined.currentWindow?.kind, "free");

  const pending: ChatSession = {
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

  const paid = paymentConfirmed(pending, quote, at);
  const afterPaidExpiry = expireWindow(paid, new Date("2026-03-19T10:10:00.000Z"));
  assert.equal(afterPaidExpiry.state, "free_text_return");
  assert.equal(afterPaidExpiry.currentWindow?.kind, "free");
  assert.deepEqual(afterPaidExpiry.enabledCapabilities, ["text"]);

  const expired = expireWindow(afterPaidExpiry, new Date("2026-03-19T10:13:00.000Z"));
  assert.equal(expired.state, "expired");
  assert.equal(expired.currentWindow, null);
  assert.deepEqual(expired.enabledCapabilities, []);

  console.log("shared-session-machine-ok");
}

runChecks();
