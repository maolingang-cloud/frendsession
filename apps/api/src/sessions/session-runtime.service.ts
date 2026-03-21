import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ChatSession, buildGrant, buildSystemMessage, expireWindow } from "@frendseesion/shared";
import { RealtimeBridgeService } from "../realtime/realtime-bridge.service";
import { StoreService } from "../store/store.service";

@Injectable()
export class SessionRuntimeService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionRuntimeService.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    @Inject(StoreService) private readonly storeService: StoreService,
    @Inject(RealtimeBridgeService) private readonly realtimeBridgeService: RealtimeBridgeService
  ) {}

  onModuleDestroy() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  async syncSession(session: ChatSession) {
    await this.realtimeBridgeService.broadcast({
      type: "session:state",
      sessionId: session.id,
      payload: session
    });

    const grant = buildGrant(session);
    if (grant) {
      await this.realtimeBridgeService.broadcast({
        type: "timer:update",
        sessionId: session.id,
        payload: grant
      });
      await this.realtimeBridgeService.broadcast({
        type: "capability:update",
        sessionId: session.id,
        payload: grant
      });
    }
  }

  scheduleWindow(session: ChatSession) {
    this.clearTimer(session.id);

    if (!session.currentWindow) {
      return;
    }

    const remainingMs = Math.max(new Date(session.currentWindow.endsAt).getTime() - Date.now(), 0);
    const timer = setTimeout(() => {
      void this.handleWindowExpiration(session.id);
    }, remainingMs);

    this.timers.set(session.id, timer);
    this.logger.log(`已为会话 ${session.id} 安排 ${session.currentWindow.kind} 定时器，剩余 ${remainingMs}ms。`);
  }

  async handleWindowExpiration(sessionId: string) {
    const currentSession = this.storeService.getSessionByIdOrThrow(sessionId);
    if (!currentSession.currentWindow) {
      return;
    }

    const now = new Date();
    const nextSession = expireWindow(currentSession, now);
    this.storeService.saveSession(nextSession);

    const message = this.storeService.addMessage(
      buildSystemMessage({
        id: this.storeService.createId("message"),
        sessionId,
        text:
          nextSession.state === "expired"
            ? "免费文字时长已结束，会话现已关闭。"
            : "付费媒体时长已结束，聊天已回到免费文字阶段。",
        at: now
      })
    );

    await this.realtimeBridgeService.broadcast({
      type: "chat:message",
      sessionId,
      payload: message
    });
    await this.syncSession(nextSession);

    if (nextSession.currentWindow) {
      this.scheduleWindow(nextSession);
    }
  }

  private clearTimer(sessionId: string) {
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(sessionId);
    }
  }
}
