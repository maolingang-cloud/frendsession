import { Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module";
import { StoreModule } from "../store/store.module";
import { SessionsController } from "./sessions.controller";
import { SessionRuntimeService } from "./session-runtime.service";
import { SessionsService } from "./sessions.service";

@Module({
  imports: [StoreModule, RealtimeModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionRuntimeService],
  exports: [SessionsService, SessionRuntimeService]
})
export class SessionsModule {}
