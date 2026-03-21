import { Injectable, Logger } from "@nestjs/common";
import { RealtimeEnvelope } from "@frendseesion/shared";

@Injectable()
export class RealtimeBridgeService {
  private readonly logger = new Logger(RealtimeBridgeService.name);
  private readonly endpoint = process.env.REALTIME_INTERNAL_EVENTS_URL ?? "http://localhost:3302/internal/events";

  async broadcast<TPayload>(envelope: RealtimeEnvelope<TPayload>) {
    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(envelope)
      });
    } catch (error) {
      this.logger.warn(`Failed to send realtime envelope ${envelope.type}: ${String(error)}`);
    }
  }
}
