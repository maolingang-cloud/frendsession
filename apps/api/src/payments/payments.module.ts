import { Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module";
import { SessionsModule } from "../sessions/sessions.module";
import { StoreModule } from "../store/store.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [StoreModule, RealtimeModule, SessionsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService]
})
export class PaymentsModule {}
