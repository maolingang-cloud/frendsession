import { Module } from "@nestjs/common";
import { RealtimeBridgeService } from "./realtime-bridge.service";

@Module({
  providers: [RealtimeBridgeService],
  exports: [RealtimeBridgeService]
})
export class RealtimeModule {}
