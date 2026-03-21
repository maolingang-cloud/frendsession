import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { type SessionCapability, buildSystemMessage, paymentConfirmed } from "@frendseesion/shared";
import { RealtimeBridgeService } from "../realtime/realtime-bridge.service";
import { SessionRuntimeService } from "../sessions/session-runtime.service";
import { StoreService } from "../store/store.service";

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(StoreService) private readonly storeService: StoreService,
    @Inject(RealtimeBridgeService) private readonly realtimeBridgeService: RealtimeBridgeService,
    @Inject(SessionRuntimeService) private readonly sessionRuntimeService: SessionRuntimeService
  ) {}

  async confirmMockPayment(sessionId: string, quoteId: string) {
    const session = this.storeService.getSessionByIdOrThrow(sessionId);
    const quote = this.storeService.getQuoteByIdOrThrow(sessionId, quoteId);

    if (session.state === "expired") {
      throw new ConflictException("会话已结束，无法继续支付。");
    }
    if (quote.status === "paid") {
      throw new ConflictException("该模拟支付已经确认过了。");
    }
    if (session.pendingQuoteId !== quote.id) {
      throw new NotFoundException("该报价不是当前待支付的请求。");
    }

    const paidQuote = this.storeService.updateQuote(sessionId, quoteId, (currentQuote) => ({
      ...currentQuote,
      status: "paid"
    }));

    const order = this.storeService.saveOrder({
      id: this.storeService.createId("order"),
      sessionId,
      quoteId,
      amountCents: paidQuote.amountCents,
      status: "paid",
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    const nextSession = paymentConfirmed(session, paidQuote, new Date());
    this.storeService.saveSession(nextSession);

    const systemMessage = this.storeService.addMessage(
      buildSystemMessage({
        id: this.storeService.createId("message"),
        sessionId,
        text: `模拟支付成功，已启用 ${paidQuote.durationMinutes} 分钟${formatCapabilities(paidQuote.capabilities)}。`,
        at: new Date()
      })
    );

    await this.sessionRuntimeService.syncSession(nextSession);
    this.sessionRuntimeService.scheduleWindow(nextSession);
    await this.realtimeBridgeService.broadcast({
      type: "payment:confirmed",
      sessionId,
      payload: order
    });
    await this.realtimeBridgeService.broadcast({
      type: "chat:message",
      sessionId,
      payload: systemMessage
    });

    return {
      order,
      session: nextSession,
      quote: paidQuote
    };
  }
}

const CAPABILITY_LABELS: Record<Exclude<SessionCapability, "text">, string> = {
  image_message: "图片消息",
  video_message: "视频消息",
  audio_call: "音频通话",
  video_call: "视频通话"
};

function formatCapabilities(capabilities: SessionCapability[]) {
  const labels = capabilities
    .filter((capability): capability is Exclude<SessionCapability, "text"> => capability !== "text")
    .map((capability) => CAPABILITY_LABELS[capability] ?? capability);
  return labels.length > 0 ? labels.join(" / ") : "媒体权限";
}
