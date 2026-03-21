import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  ChatSession,
  GuestParticipant,
  Message,
  PaymentOrder,
  PaymentQuote,
  SessionSummaryResponse,
  User,
  buildInitialSession,
  isSessionActive
} from "@frendseesion/shared";
import { randomUUID } from "node:crypto";

@Injectable()
export class StoreService {
  private readonly authCodes = new Map<string, string>();
  private readonly usersById = new Map<string, User>();
  private readonly userIdByPhone = new Map<string, string>();
  private readonly sessionsById = new Map<string, ChatSession>();
  private readonly sessionIdByJoinToken = new Map<string, string>();
  private readonly messagesBySessionId = new Map<string, Message[]>();
  private readonly quotesBySessionId = new Map<string, PaymentQuote[]>();
  private readonly ordersById = new Map<string, PaymentOrder>();

  issueAuthCode(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    const code = digits.slice(-6).padStart(6, "2").slice(0, 6);
    this.authCodes.set(phone, code);
    return code;
  }

  verifyAuthCode(phone: string, code: string): boolean {
    const expected = this.authCodes.get(phone);
    return expected === code;
  }

  upsertUser(phone: string): User {
    const existingUserId = this.userIdByPhone.get(phone);
    if (existingUserId) {
      return this.getUserByIdOrThrow(existingUserId);
    }

    const user: User = {
      id: this.createId("user"),
      phone,
      displayName: `发起方 ${phone.slice(-4)}`,
      createdAt: new Date().toISOString()
    };

    this.usersById.set(user.id, user);
    this.userIdByPhone.set(phone, user.id);
    return user;
  }

  getUserById(userId: string) {
    return this.usersById.get(userId) ?? null;
  }

  getUserByIdOrThrow(userId: string) {
    const user = this.getUserById(userId);
    if (!user) {
      throw new NotFoundException(`未找到用户 ${userId}。`);
    }
    return user;
  }

  createSession(input: {
    initiatorId: string;
    initiatorDisplayName: string;
    joinToken: string;
    joinUrl: string;
  }) {
    const session = buildInitialSession({
      id: this.createId("session"),
      initiatorId: input.initiatorId,
      initiatorDisplayName: input.initiatorDisplayName,
      joinToken: input.joinToken,
      joinUrl: input.joinUrl,
      at: new Date()
    });

    this.sessionsById.set(session.id, session);
    this.sessionIdByJoinToken.set(session.joinToken, session.id);
    this.messagesBySessionId.set(session.id, []);
    this.quotesBySessionId.set(session.id, []);
    return session;
  }

  findLatestActiveSessionByInitiator(initiatorId: string) {
    const sessions = [...this.sessionsById.values()]
      .filter((session) => session.initiatorId === initiatorId && isSessionActive(session.state))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    return sessions[0] ?? null;
  }

  saveSession(session: ChatSession) {
    this.sessionsById.set(session.id, session);
    this.sessionIdByJoinToken.set(session.joinToken, session.id);
    return session;
  }

  getSessionById(sessionId: string) {
    return this.sessionsById.get(sessionId) ?? null;
  }

  getSessionByIdOrThrow(sessionId: string) {
    const session = this.getSessionById(sessionId);
    if (!session) {
      throw new NotFoundException(`未找到会话 ${sessionId}。`);
    }
    return session;
  }

  getSessionByJoinTokenOrThrow(joinToken: string) {
    const sessionId = this.sessionIdByJoinToken.get(joinToken);
    if (!sessionId) {
      throw new NotFoundException(`加入令牌 ${joinToken} 无效。`);
    }
    return this.getSessionByIdOrThrow(sessionId);
  }

  ensureGuestSlotAvailable(session: ChatSession) {
    if (session.guest) {
      throw new ConflictException("当前会话已经有接收端加入。");
    }
  }

  saveGuest(sessionId: string, displayName: string): GuestParticipant {
    const guest: GuestParticipant = {
      id: this.createId("guest"),
      displayName,
      joinedAt: new Date().toISOString()
    };

    const session = this.getSessionByIdOrThrow(sessionId);
    this.saveSession({ ...session, guest });
    return guest;
  }

  addMessage(message: Message) {
    const existing = this.messagesBySessionId.get(message.sessionId) ?? [];
    existing.push(message);
    this.messagesBySessionId.set(message.sessionId, existing);
    return message;
  }

  listMessages(sessionId: string) {
    return [...(this.messagesBySessionId.get(sessionId) ?? [])];
  }

  addQuote(quote: PaymentQuote) {
    const existing = this.quotesBySessionId.get(quote.sessionId) ?? [];
    existing.push(quote);
    this.quotesBySessionId.set(quote.sessionId, existing);
    return quote;
  }

  updateQuote(sessionId: string, quoteId: string, updater: (quote: PaymentQuote) => PaymentQuote) {
    const quotes = this.quotesBySessionId.get(sessionId) ?? [];
    const nextQuotes = quotes.map((quote) => (quote.id === quoteId ? updater(quote) : quote));
    this.quotesBySessionId.set(sessionId, nextQuotes);
    const updated = nextQuotes.find((quote) => quote.id === quoteId);
    if (!updated) {
      throw new NotFoundException(`未找到报价 ${quoteId}。`);
    }
    return updated;
  }

  getQuoteByIdOrThrow(sessionId: string, quoteId: string) {
    const quote = (this.quotesBySessionId.get(sessionId) ?? []).find((candidate) => candidate.id === quoteId);
    if (!quote) {
      throw new NotFoundException(`未找到报价 ${quoteId}。`);
    }
    return quote;
  }

  listQuotes(sessionId: string) {
    return [...(this.quotesBySessionId.get(sessionId) ?? [])];
  }

  saveOrder(order: PaymentOrder) {
    this.ordersById.set(order.id, order);
    return order;
  }

  getSessionSummary(sessionId: string): SessionSummaryResponse {
    return {
      session: this.getSessionByIdOrThrow(sessionId),
      messages: this.listMessages(sessionId),
      quotes: this.listQuotes(sessionId)
    };
  }

  createId(prefix: string) {
    return `${prefix}_${randomUUID()}`;
  }
}
