import { Module } from "@nestjs/common";
import { StoreModule } from "../store/store.module";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [StoreModule],
  controllers: [UploadsController],
  providers: [UploadsService]
})
export class UploadsModule {}
