import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  ChatSession,
  Message,
  SessionCapability,
  User,
  buildSystemMessage,
  calculateQuoteAmount,
  canUseCapability,
  guestJoined,
  isSessionActive,
  quoteCreated
} from "@frendseesion/shared";
import { RealtimeBridgeService } from "../realtime/realtime-bridge.service";
import { StoreService } from "../store/store.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { CreatePaymentQuoteDto } from "./dto/create-payment-quote.dto";
import { CreateSessionDto } from "./dto/create-session.dto";
import { JoinSessionDto } from "./dto/join-session.dto";
import { SessionRuntimeService } from "./session-runtime.service";

@Injectable()
export class SessionsService {
  constructor(
    @Inject(StoreService) private readonly storeService: StoreService,
    @Inject(RealtimeBridgeService) private readonly realtimeBridgeService: RealtimeBridgeService,
    @Inject(SessionRuntimeService) private readonly sessionRuntimeService: SessionRuntimeService
  ) {}

  async createSession(user: User, dto: CreateSessionDto) {
    const existingSession = this.storeService.findLatestActiveSessionByInitiator(user.id);
    if (existingSession) {
      return existingSession;
    }

    const joinToken = this.storeService.createId("join");
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const session = this.storeService.createSession({
      initiatorId: user.id,
      initiatorDisplayName: dto.initiatorDisplayName?.trim() || user.displayName,
      joinToken,
      joinUrl: `${appUrl}/join/${joinToken}`
    });

    await this.sessionRuntimeService.syncSession(session);
    return session;
  }

  getJoinPreview(joinToken: string) {
    const session = this.storeService.getSessionByJoinTokenOrThrow(joinToken);
    return {
      sessionId: session.id,
      joinToken: session.joinToken,
      joinUrl: session.joinUrl,
      initiatorDisplayName: session.initiatorDisplayName,
      state: session.state,
      guestJoined: Boolean(session.guest)
    };
  }

  getSessionSummary(sessionId: string) {
    return this.storeService.getSessionSummary(sessionId);
  }

  async joinSession(sessionId: string, dto: JoinSessionDto) {
    const session = this.storeService.getSessionByIdOrThrow(sessionId);
    if (!isSessionActive(session.state)) {
      throw new ConflictException("该会话已结束。");
    }

    this.storeService.ensureGuestSlotAvailable(session);
    const guest = this.storeService.saveGuest(session.id, dto.displayName);
    const nextSession = guestJoined(this.storeService.getSessionByIdOrThrow(session.id), guest, new Date());
    this.storeService.saveSession(nextSession);

    const joinMessage = this.storeService.addMessage(
      buildSystemMessage({
        id: this.storeService.createId("message"),
        sessionId: session.id,
        text: `${guest.displayName} 已加入聊天，免费文字倒计时已开始。`,
        at: new Date()
      })
    );

    await this.realtimeBridgeService.broadcast({
      type: "chat:message",
      sessionId: session.id,
      payload: joinMessage
    });
    await this.sessionRuntimeService.syncSession(nextSession);
    this.sessionRuntimeService.scheduleWindow(nextSession);

    return this.storeService.getSessionSummary(session.id);
  }

  async createPaymentQuote(user: User, sessionId: string, dto: CreatePaymentQuoteDto) {
    const session = this.requireInitiatorSession(user.id, sessionId);
    if (!session.guest) {
      throw new BadRequestException("必须等接收端加入后才能创建支付选项。");
    }
    if (session.state === "expired") {
      throw new ConflictException("会话已结束，无法创建支付请求。");
    }

    const quoteId = this.storeService.createId("quote");
    const quote = this.storeService.addQuote({
      id: quoteId,
      sessionId,
      capabilities: dto.capabilities,
      durationMinutes: dto.durationMinutes,
      amountCents: calculateQuoteAmount({
        capabilities: dto.capabilities,
        durationMinutes: dto.durationMinutes
      }),
      qrPayload: `${process.env.APP_URL ?? "http://localhost:3000"}/pay/mock?sessionId=${sessionId}&quoteId=${quoteId}`,
      status: "pending",
      createdAt: new Date().toISOString()
    });

    const nextSession = quoteCreated(session, quote, new Date());
    this.storeService.saveSession(nextSession);

    const message = this.storeService.addMessage({
      id: this.storeService.createId("message"),
      sessionId,
      senderId: user.id,
      senderRole: "initiator",
      type: "payment_request",
      text: `${dto.title}，时长 ${dto.durationMinutes} 分钟，待支付 ${formatCents(quote.amountCents)}。`,
      paymentQuoteId: quote.id,
      createdAt: new Date().toISOString()
    });

    await this.sessionRuntimeService.syncSession(nextSession);
    await this.realtimeBridgeService.broadcast({
      type: "payment:created",
      sessionId,
      payload: quote
    });
    await this.realtimeBridgeService.broadcast({
      type: "chat:message",
      sessionId,
      payload: message
    });

    return quote;
  }

  async createMessage(sessionId: string, dto: CreateMessageDto) {
    const session = this.storeService.getSessionByIdOrThrow(sessionId);
    this.assertCanPostMessage(session, dto.senderRole, dto.senderId, dto.type as "text" | "image" | "video");

    const message = this.storeService.addMessage({
      id: this.storeService.createId("message"),
      sessionId,
      senderId: dto.senderId,
      senderRole: dto.senderRole,
      type: dto.type,
      text: dto.text,
      mediaUrl: dto.mediaUrl,
      previewUrl: dto.previewUrl,
      createdAt: new Date().toISOString()
    });

    await this.realtimeBridgeService.broadcast({
      type: "chat:message",
      sessionId,
      payload: message
    });

    return message;
  }

  private requireInitiatorSession(userId: string, sessionId: string) {
    const session = this.storeService.getSessionByIdOrThrow(sessionId);
    if (session.initiatorId !== userId) {
      throw new NotFoundException("当前发起方找不到该会话。");
    }
    return session;
  }

  private assertCanPostMessage(
    session: ChatSession,
    senderRole: Message["senderRole"],
    senderId: string,
    messageType: "text" | "image" | "video"
  ) {
    if (session.state === "expired") {
      throw new ConflictException("会话已结束，无法发送消息。");
    }

    if (senderRole === "initiator" && session.initiatorId !== senderId) {
      throw new BadRequestException("发起方身份与当前会话不匹配。");
    }

    if (senderRole === "guest" && session.guest?.id !== senderId) {
      throw new BadRequestException("接收端身份与当前会话不匹配。");
    }

    const requiredCapability: SessionCapability =
      messageType === "text" ? "text" : messageType === "image" ? "image_message" : "video_message";

    if (!canUseCapability(session, requiredCapability)) {
      throw new ConflictException(`当前会话未启用 ${requiredCapability} 功能。`);
    }
  }
}

function formatCents(amountCents: number) {
  return `￥${(amountCents / 100).toFixed(2)}`;
}
