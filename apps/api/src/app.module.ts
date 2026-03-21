import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./common/health.controller";
import { PaymentsModule } from "./payments/payments.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { SessionsModule } from "./sessions/sessions.module";
import { StoreModule } from "./store/store.module";
import { UploadsModule } from "./uploads/uploads.module";

@Module({
  imports: [StoreModule, RealtimeModule, AuthModule, SessionsModule, PaymentsModule, UploadsModule],
  controllers: [HealthController]
})
export class AppModule {}
