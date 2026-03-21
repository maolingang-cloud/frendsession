import { Inject, Injectable } from "@nestjs/common";
import { SignedUploadResponse } from "@frendseesion/shared";
import { StoreService } from "../store/store.service";

@Injectable()
export class UploadsService {
  constructor(@Inject(StoreService) private readonly storeService: StoreService) {}

  signUpload(fileName: string, mimeType: string): SignedUploadResponse {
    const bucket = process.env.MINIO_BUCKET ?? "chat-media";
    const key = `${new Date().toISOString().slice(0, 10)}/${this.storeService.createId("upload")}-${sanitize(
      fileName
    )}`;
    const baseUrl = `http://${process.env.MINIO_ENDPOINT ?? "localhost"}:${process.env.MINIO_PORT ?? "9000"}/${bucket}`;

    return {
      key,
      uploadUrl: `${baseUrl}/${key}?mockSigned=true&contentType=${encodeURIComponent(mimeType)}`,
      publicUrl: `${baseUrl}/${key}`,
      expiresInSeconds: 900
    };
  }
}

function sanitize(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
}
